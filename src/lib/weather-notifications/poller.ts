import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchNwsActiveAlerts } from "@/lib/weather/providers/nws";
import { evaluateAlertDelivery } from "./alert-deduplication";
import {
  locationGroupKey,
  mapNwsAlertsForDelivery,
  resolveCoordinatesForGroupKey,
  type LocationGroupKey,
} from "./alert-mapper";
import {
  deliverAlertToUserDevices,
  mapPreferencesRow,
  recordProcessedAlertForUser,
  type EnabledUserContext,
} from "./delivery";
import {
  computeQuietHoursReleaseTime,
  enqueueDelayedDelivery,
  processDueDelayedDeliveries,
} from "./delayed-deliveries";
import type { MappedNwsAlertForDelivery, WeatherNotificationPreferences } from "./types";

type AdminDb = SupabaseClient;

function prefsTable(db: AdminDb) {
  return (db as unknown as { from: (table: string) => ReturnType<AdminDb["from"]> }).from(
    "weather_notification_preferences",
  );
}

function processedTable(db: AdminDb) {
  return (db as unknown as { from: (table: string) => ReturnType<AdminDb["from"]> }).from(
    "processed_weather_alerts",
  );
}

function pollRunsTable(db: AdminDb) {
  return (db as unknown as { from: (table: string) => ReturnType<AdminDb["from"]> }).from(
    "weather_alert_poll_runs",
  );
}

export type WeatherAlertPollResult = {
  pollRunId: string;
  groupsPolled: number;
  alertsFetched: number;
  deliveriesSent: number;
  deliveriesDelayed: number;
  deliveriesSuppressed: number;
  deliveriesFailed: number;
  delayedQueueProcessed: { sent: number; expired: number; failed: number };
};

async function listEnabledPreferences(db: AdminDb): Promise<WeatherNotificationPreferences[]> {
  const { data, error } = await prefsTable(db).select("*").eq("enabled", true);
  if (error) throw error;
  return (data ?? []).map((row) => mapPreferencesRow(row as Record<string, unknown>));
}

async function listProcessedIdsForUser(db: AdminDb, userId: string): Promise<string[]> {
  const { data, error } = await processedTable(db)
    .select("nws_alert_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((row) => (row as { nws_alert_id: string }).nws_alert_id);
}

function groupUsersByLocation(
  users: WeatherNotificationPreferences[],
): Map<LocationGroupKey, WeatherNotificationPreferences[]> {
  const groups = new Map<LocationGroupKey, WeatherNotificationPreferences[]>();

  for (const user of users) {
    const key = locationGroupKey(user);
    if (!key) continue;
    const bucket = groups.get(key) ?? [];
    bucket.push(user);
    groups.set(key, bucket);
  }

  return groups;
}

async function createPollRun(db: AdminDb, triggeredBy?: string): Promise<string> {
  const { data, error } = await pollRunsTable(db)
    .insert({
      triggered_by: triggeredBy ?? null,
      trigger_source: triggeredBy ? "admin-manual" : "cli",
      status: "running",
    })
    .select("id")
    .single();

  if (error) throw error;
  return (data as { id: string }).id;
}

async function finishPollRun(
  db: AdminDb,
  pollRunId: string,
  result: Omit<WeatherAlertPollResult, "pollRunId" | "delayedQueueProcessed"> & {
    delayedQueueProcessed: WeatherAlertPollResult["delayedQueueProcessed"];
    errorMessage?: string;
  },
): Promise<void> {
  const { error } = await pollRunsTable(db)
    .update({
      finished_at: new Date().toISOString(),
      status: result.errorMessage ? "failed" : "completed",
      groups_polled: result.groupsPolled,
      alerts_fetched: result.alertsFetched,
      deliveries_sent: result.deliveriesSent,
      deliveries_delayed: result.deliveriesDelayed,
      deliveries_suppressed: result.deliveriesSuppressed,
      deliveries_failed: result.deliveriesFailed,
      error_message: result.errorMessage ?? null,
    })
    .eq("id", pollRunId);

  if (error) throw error;
}

export async function runWeatherAlertPollCycle(
  db: AdminDb,
  options?: { triggeredBy?: string; now?: Date },
): Promise<WeatherAlertPollResult> {
  const now = options?.now ?? new Date();
  const pollRunId = await createPollRun(db, options?.triggeredBy);

  let groupsPolled = 0;
  let alertsFetched = 0;
  let deliveriesSent = 0;
  let deliveriesDelayed = 0;
  let deliveriesSuppressed = 0;
  let deliveriesFailed = 0;

  try {
    const enabledUsers = await listEnabledPreferences(db);
    const groups = groupUsersByLocation(enabledUsers);

    for (const [groupKey, users] of groups.entries()) {
      const coords = await resolveCoordinatesForGroupKey(groupKey);
      if (!coords) continue;

      groupsPolled += 1;
      const nwsAlerts = await fetchNwsActiveAlerts(coords.lat, coords.lon);
      const alerts = mapNwsAlertsForDelivery(nwsAlerts);
      alertsFetched += alerts.length;

      for (const user of users) {
        const processedIds = await listProcessedIdsForUser(db, user.userId);
        const processed = processedIds.map((nwsAlertId) => ({ nwsAlertId }));

        for (const alert of alerts) {
          const decision = evaluateAlertDelivery(user, alert, processed, now);

          if (decision.action === "suppress") {
            await recordProcessedAlertForUser(db, user.userId, alert, "suppressed", {
              failureReason: decision.reason,
            });
            deliveriesSuppressed += 1;
            processed.push({ nwsAlertId: alert.id });
            continue;
          }

          if (decision.action === "delay") {
            const scheduledFor = computeQuietHoursReleaseTime(user, now);
            await enqueueDelayedDelivery(db, user.userId, alert, scheduledFor);
            await recordProcessedAlertForUser(db, user.userId, alert, "pending", {
              failureReason: decision.reason,
            });
            deliveriesDelayed += 1;
            processed.push({ nwsAlertId: alert.id });
            continue;
          }

          const delivery = await deliverAlertToUserDevices(db, user.userId, alert);
          if (delivery.sent > 0) {
            deliveriesSent += delivery.sent;
          } else {
            deliveriesFailed += 1;
          }
          processed.push({ nwsAlertId: alert.id });
        }

        await prefsTable(db)
          .update({ last_alert_checked_at: now.toISOString() })
          .eq("user_id", user.userId);
      }
    }

    const delayedQueueProcessed = await processDueDelayedDeliveries(db, now);
    deliveriesSent += delayedQueueProcessed.sent;
    deliveriesFailed += delayedQueueProcessed.failed;

    await finishPollRun(db, pollRunId, {
      groupsPolled,
      alertsFetched,
      deliveriesSent,
      deliveriesDelayed,
      deliveriesSuppressed,
      deliveriesFailed,
      delayedQueueProcessed,
    });

    return {
      pollRunId,
      groupsPolled,
      alertsFetched,
      deliveriesSent,
      deliveriesDelayed,
      deliveriesSuppressed,
      deliveriesFailed,
      delayedQueueProcessed,
    };
  } catch (error) {
    await finishPollRun(db, pollRunId, {
      groupsPolled,
      alertsFetched,
      deliveriesSent,
      deliveriesDelayed,
      deliveriesSuppressed,
      deliveriesFailed,
      delayedQueueProcessed: { sent: 0, expired: 0, failed: 0 },
      errorMessage: error instanceof Error ? error.message : "Poll cycle failed",
    });
    throw error;
  }
}

export type { EnabledUserContext };
