import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MappedNwsAlertForDelivery,
  PushSubscriptionRecord,
  WeatherAlertDeliveryStatus,
  WeatherNotificationPreferences,
} from "./types";
import { buildAlertPushPayload, buildDevelopmentServerTestPayload } from "./push-payload";
import {
  classifyPushStatusCode,
  pushErrorMessage,
  shouldDeactivateImmediately,
  shouldDeactivateAfterThreshold,
} from "./delivery-errors";

type AdminDb = SupabaseClient;

function pushSubsTable(db: AdminDb) {
  return (db as unknown as { from: (table: string) => ReturnType<AdminDb["from"]> }).from(
    "push_subscriptions",
  );
}

function processedTable(db: AdminDb) {
  return (db as unknown as { from: (table: string) => ReturnType<AdminDb["from"]> }).from(
    "processed_weather_alerts",
  );
}

export async function listActiveSubscriptionsForUser(
  db: AdminDb,
  userId: string,
): Promise<PushSubscriptionRecord[]> {
  const { data, error } = await pushSubsTable(db)
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .is("revoked_at", null);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      endpoint: r.endpoint as string,
      p256dh: r.p256dh as string,
      auth: r.auth as string,
      userAgent: (r.user_agent as string | null) ?? null,
      deviceLabel: (r.device_label as string | null) ?? null,
      isActive: Boolean(r.is_active),
      lastSuccessAt: (r.last_success_at as string | null) ?? null,
      failureCount: Number(r.failure_count ?? 0),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
      revokedAt: (r.revoked_at as string | null) ?? null,
    };
  });
}

async function recordSubscriptionOutcome(
  db: AdminDb,
  subscriptionId: string,
  result: { ok: boolean; statusCode?: number; errorMessage?: string },
): Promise<void> {
  if (result.ok) {
    await pushSubsTable(db)
      .update({ last_success_at: new Date().toISOString(), failure_count: 0 })
      .eq("id", subscriptionId);
    return;
  }

  const { data, error: readError } = await pushSubsTable(db)
    .select("failure_count")
    .eq("id", subscriptionId)
    .single();
  if (readError) throw readError;

  const nextCount = Number((data as { failure_count?: number }).failure_count ?? 0) + 1;
  const updates: Record<string, unknown> = { failure_count: nextCount };

  if (shouldDeactivateImmediately(result.statusCode) || shouldDeactivateAfterThreshold(nextCount)) {
    updates.is_active = false;
    updates.revoked_at = new Date().toISOString();
  }

  const { error } = await pushSubsTable(db).update(updates).eq("id", subscriptionId);
  if (error) throw error;
}

export async function recordProcessedAlertForUser(
  db: AdminDb,
  userId: string,
  alert: MappedNwsAlertForDelivery,
  deliveryStatus: WeatherAlertDeliveryStatus,
  options?: { failureReason?: string; sentAt?: string },
): Promise<void> {
  const payload = {
    user_id: userId,
    nws_alert_id: alert.id,
    severity: alert.severity,
    event_name: alert.eventName,
    expires_at: alert.expiresAt,
    delivery_status: deliveryStatus,
    failure_reason: options?.failureReason ?? null,
    sent_at:
      options?.sentAt ??
      (deliveryStatus === "sent" || deliveryStatus === "test" ? new Date().toISOString() : null),
  };

  const { error } = await processedTable(db).upsert(payload, {
    onConflict: "user_id,nws_alert_id",
  });
  if (error) throw error;
}

export type MultiDeviceDeliveryResult = {
  sent: number;
  failed: number;
  deactivated: number;
};

export async function deliverAlertToUserDevices(
  db: AdminDb,
  userId: string,
  alert: MappedNwsAlertForDelivery,
  options?: { test?: boolean },
): Promise<MultiDeviceDeliveryResult> {
  // `web-push` depends on Node crypto. Keep it out of the application's eager
  // SSR module graph so Cloudflare can start and render public pages. The
  // implementation is loaded only when a server-side delivery is requested.
  const { sendWebPushToSubscription } = await import("./web-push");
  const subscriptions = await listActiveSubscriptionsForUser(db, userId);
  if (subscriptions.length === 0) {
    await recordProcessedAlertForUser(db, userId, alert, "failed", {
      failureReason: "No active device subscriptions.",
    });
    return { sent: 0, failed: 1, deactivated: 0 };
  }

  const payload = options?.test
    ? buildDevelopmentServerTestPayload()
    : buildAlertPushPayload(alert, { url: "/" });

  let sent = 0;
  let failed = 0;
  let deactivated = 0;

  for (const subscription of subscriptions) {
    const result = await sendWebPushToSubscription(subscription, payload);
    await recordSubscriptionOutcome(db, subscription.id, result);

    if (result.ok) {
      sent += 1;
    } else {
      failed += 1;
      if (
        shouldDeactivateImmediately(result.statusCode) ||
        shouldDeactivateAfterThreshold(subscription.failureCount + 1)
      ) {
        deactivated += 1;
      }
    }
  }

  const deliveryStatus: WeatherAlertDeliveryStatus =
    sent > 0 ? (options?.test ? "test" : "sent") : "failed";

  await recordProcessedAlertForUser(db, userId, alert, deliveryStatus, {
    failureReason: sent > 0 ? null : pushErrorMessage("All device deliveries failed"),
  });

  return { sent, failed, deactivated };
}

export async function sendDevelopmentServerPushTest(
  db: AdminDb,
  userId: string,
): Promise<MultiDeviceDeliveryResult> {
  const testAlert: MappedNwsAlertForDelivery = {
    id: `dev-server-test-${Date.now()}`,
    severity: "advisory",
    eventName: "Development server push test",
    effectiveAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };

  return deliverAlertToUserDevices(db, userId, testAlert, { test: true });
}

export function isTransientPushFailure(statusCode: number | undefined): boolean {
  return classifyPushStatusCode(statusCode) === "transient";
}

export type EnabledUserContext = {
  preferences: WeatherNotificationPreferences;
  subscriptions: PushSubscriptionRecord[];
};

export function mapPreferencesRow(row: Record<string, unknown>): WeatherNotificationPreferences {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    enabled: Boolean(row.enabled),
    alertsEnabled: Boolean(row.alerts_enabled),
    watchesEnabled: Boolean(row.watches_enabled),
    warningsEnabled: Boolean(row.warnings_enabled),
    emergenciesEnabled: Boolean(row.emergencies_enabled),
    dailyForecastEnabled: Boolean(row.daily_forecast_enabled),
    locationSource:
      (row.location_source as WeatherNotificationPreferences["locationSource"]) ?? null,
    countyName: (row.county_name as string | null) ?? null,
    stateCode: (row.state_code as string | null) ?? null,
    latitudeBucket: row.latitude_bucket != null ? Number(row.latitude_bucket) : null,
    longitudeBucket: row.longitude_bucket != null ? Number(row.longitude_bucket) : null,
    quietHoursEnabled: Boolean(row.quiet_hours_enabled),
    quietHoursStart: (row.quiet_hours_start as string | null) ?? null,
    quietHoursEnd: (row.quiet_hours_end as string | null) ?? null,
    timezone: (row.timezone as string) ?? "America/Chicago",
    lastAlertCheckedAt: (row.last_alert_checked_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
