import type { AdminPushSubscriptionRow, AdminWeatherNotificationSummary } from "./types";
import {
  deactivateFailedSubscription,
  listPushSubscriptions,
  subscribeDevice,
  unsubscribeDevice,
} from "./subscriptions";
import {
  defaultWeatherNotificationPreferences,
  getWeatherNotificationPreferences,
  saveWeatherNotificationPreferences,
} from "./preferences";
import {
  recordProcessedAlert,
  listProcessedAlertsForUser,
  isAlertAlreadyProcessed,
} from "./processed-alerts";

export {
  defaultWeatherNotificationPreferences,
  getWeatherNotificationPreferences,
  saveWeatherNotificationPreferences,
  subscribeDevice,
  unsubscribeDevice,
  deactivateFailedSubscription,
  recordProcessedAlert,
  listProcessedAlertsForUser,
  isAlertAlreadyProcessed,
  listPushSubscriptions,
};

export {
  evaluateAlertDelivery,
  isAlertActive,
  isAlertExpired,
  isDuplicateProcessedAlert,
} from "./alert-deduplication";
export { severityPreferenceEnabled } from "./preferences-matching";
export { isQuietHoursActive, shouldBypassQuietHours } from "./quiet-hours";
export { bucketCoordinate, bucketCoordinates } from "./coordinate-buckets";

function maskEndpointHost(endpoint: string): string {
  try {
    return new URL(endpoint).host;
  } catch {
    return "unknown-host";
  }
}

function mapAdminSubscriptionRow(row: Record<string, unknown>): AdminPushSubscriptionRow {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    deviceLabel: (row.device_label as string | null) ?? null,
    isActive: Boolean(row.is_active),
    failureCount: Number(row.failure_count ?? 0),
    lastSuccessAt: (row.last_success_at as string | null) ?? null,
    revokedAt: (row.revoked_at as string | null) ?? null,
    updatedAt: row.updated_at as string,
    endpointHost: maskEndpointHost(row.endpoint as string),
  };
}

export async function fetchAdminWeatherNotificationSummary(): Promise<AdminWeatherNotificationSummary> {
  const { supabase } = await import("@/integrations/supabase/client");
  const db = supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  };

  const [
    enabledRes,
    activeRes,
    failedRes,
    deactivatedRes,
    sentRes,
    failedDeliveryRes,
    suppressedRes,
    delayedPendingRes,
    recentRes,
    deviceSubsRes,
    delayedRes,
    pollRes,
  ] = await Promise.all([
    db
      .from("weather_notification_preferences")
      .select("id", { count: "exact", head: true })
      .eq("enabled", true),
    db
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .is("revoked_at", null),
    db
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .gt("failure_count", 0),
    db
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .not("revoked_at", "is", null),
    db
      .from("processed_weather_alerts")
      .select("id", { count: "exact", head: true })
      .eq("delivery_status", "sent"),
    db
      .from("processed_weather_alerts")
      .select("id", { count: "exact", head: true })
      .eq("delivery_status", "failed"),
    db
      .from("processed_weather_alerts")
      .select("id", { count: "exact", head: true })
      .eq("delivery_status", "suppressed"),
    db
      .from("weather_alert_delayed_deliveries")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("processed_weather_alerts")
      .select("id, event_name, severity, delivery_status, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("push_subscriptions")
      .select(
        "id, user_id, device_label, is_active, failure_count, last_success_at, revoked_at, updated_at, endpoint",
      )
      .order("updated_at", { ascending: false })
      .limit(50),
    db
      .from("weather_alert_delayed_deliveries")
      .select("id, user_id, event_name, severity, scheduled_for, status, created_at")
      .order("scheduled_for", { ascending: true })
      .limit(30),
    db
      .from("weather_alert_poll_runs")
      .select(
        "id, started_at, finished_at, status, groups_polled, alerts_fetched, deliveries_sent, deliveries_delayed, deliveries_suppressed, deliveries_failed, error_message",
      )
      .order("started_at", { ascending: false })
      .limit(1),
  ]);

  for (const res of [
    enabledRes,
    activeRes,
    failedRes,
    deactivatedRes,
    sentRes,
    failedDeliveryRes,
    suppressedRes,
    delayedPendingRes,
    recentRes,
    deviceSubsRes,
    delayedRes,
    pollRes,
  ]) {
    if (res.error) throw res.error;
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const processedLast7 = (recentRes.data ?? []).filter(
    (row) => String((row as { created_at?: string }).created_at ?? "") >= sevenDaysAgo,
  ).length;

  const latestPoll = pollRes.data?.[0] as Record<string, unknown> | undefined;

  return {
    enabledUsers: enabledRes.count ?? 0,
    activeSubscriptions: activeRes.count ?? 0,
    failedSubscriptions: failedRes.count ?? 0,
    deactivatedSubscriptions: deactivatedRes.count ?? 0,
    successfulDeliveries: sentRes.count ?? 0,
    failedDeliveries: failedDeliveryRes.count ?? 0,
    suppressedAlerts: suppressedRes.count ?? 0,
    delayedAlertsPending: delayedPendingRes.count ?? 0,
    processedAlertsLast7Days: processedLast7,
    recentProcessedAlerts: (recentRes.data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id as string,
        eventName: r.event_name as string,
        severity: r.severity as string,
        deliveryStatus:
          r.delivery_status as AdminWeatherNotificationSummary["recentProcessedAlerts"][number]["deliveryStatus"],
        createdAt: r.created_at as string,
      };
    }),
    subscriptionsByDevice: (deviceSubsRes.data ?? []).map((row) =>
      mapAdminSubscriptionRow(row as Record<string, unknown>),
    ),
    delayedAlerts: (delayedRes.data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id as string,
        userId: r.user_id as string,
        eventName: r.event_name as string,
        severity: r.severity as string,
        scheduledFor: r.scheduled_for as string,
        status: r.status as AdminWeatherNotificationSummary["delayedAlerts"][number]["status"],
        createdAt: r.created_at as string,
      };
    }),
    latestPollRun: latestPoll
      ? {
          id: latestPoll.id as string,
          startedAt: latestPoll.started_at as string,
          finishedAt: (latestPoll.finished_at as string | null) ?? null,
          status: latestPoll.status as string,
          groupsPolled: Number(latestPoll.groups_polled ?? 0),
          alertsFetched: Number(latestPoll.alerts_fetched ?? 0),
          deliveriesSent: Number(latestPoll.deliveries_sent ?? 0),
          deliveriesDelayed: Number(latestPoll.deliveries_delayed ?? 0),
          deliveriesSuppressed: Number(latestPoll.deliveries_suppressed ?? 0),
          deliveriesFailed: Number(latestPoll.deliveries_failed ?? 0),
          errorMessage: (latestPoll.error_message as string | null) ?? null,
        }
      : null,
  };
}

export async function listAdminFailedPushSubscriptions(): Promise<AdminPushSubscriptionRow[]> {
  const { supabase } = await import("@/integrations/supabase/client");
  const db = supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  };

  const { data, error } = await db
    .from("push_subscriptions")
    .select(
      "id, user_id, device_label, is_active, failure_count, last_success_at, revoked_at, updated_at, endpoint",
    )
    .or("failure_count.gt.0,is_active.eq.false")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map((row) => mapAdminSubscriptionRow(row as Record<string, unknown>));
}
