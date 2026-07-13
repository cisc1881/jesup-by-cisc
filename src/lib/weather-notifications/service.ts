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

export { evaluateAlertDelivery, isAlertActive, isAlertExpired, isDuplicateProcessedAlert } from "./alert-deduplication";
export { severityPreferenceEnabled } from "./preferences-matching";
export { isQuietHoursActive, shouldBypassQuietHours } from "./quiet-hours";
export { bucketCoordinate, bucketCoordinates } from "./coordinate-buckets";

export async function fetchAdminWeatherNotificationSummary(): Promise<AdminWeatherNotificationSummary> {
  const { supabase } = await import("@/integrations/supabase/client");
  const db = supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  };

  const [enabledRes, activeRes, failedRes, recentRes] = await Promise.all([
    db.from("weather_notification_preferences").select("id", { count: "exact", head: true }).eq("enabled", true),
    db
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .is("revoked_at", null),
    db.from("push_subscriptions").select("id", { count: "exact", head: true }).gt("failure_count", 0),
    db
      .from("processed_weather_alerts")
      .select("id, event_name, severity, delivery_status, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (enabledRes.error) throw enabledRes.error;
  if (activeRes.error) throw activeRes.error;
  if (failedRes.error) throw failedRes.error;
  if (recentRes.error) throw recentRes.error;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const processedLast7 = (recentRes.data ?? []).filter(
    (row) => String((row as { created_at?: string }).created_at ?? "") >= sevenDaysAgo,
  ).length;

  return {
    enabledUsers: enabledRes.count ?? 0,
    activeSubscriptions: activeRes.count ?? 0,
    failedSubscriptions: failedRes.count ?? 0,
    processedAlertsLast7Days: processedLast7,
    recentProcessedAlerts: (recentRes.data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id as string,
        eventName: r.event_name as string,
        severity: r.severity as string,
        deliveryStatus: r.delivery_status as AdminWeatherNotificationSummary["recentProcessedAlerts"][number]["deliveryStatus"],
        createdAt: r.created_at as string,
      };
    }),
  };
}

function maskEndpointHost(endpoint: string): string {
  try {
    return new URL(endpoint).host;
  } catch {
    return "unknown-host";
  }
}

export async function listAdminFailedPushSubscriptions(): Promise<AdminPushSubscriptionRow[]> {
  const { supabase } = await import("@/integrations/supabase/client");
  const db = supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  };

  const { data, error } = await db
    .from("push_subscriptions")
    .select("id, user_id, device_label, is_active, failure_count, last_success_at, revoked_at, updated_at, endpoint")
    .or("failure_count.gt.0,is_active.eq.false")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      userId: r.user_id as string,
      deviceLabel: (r.device_label as string | null) ?? null,
      isActive: Boolean(r.is_active),
      failureCount: Number(r.failure_count ?? 0),
      lastSuccessAt: (r.last_success_at as string | null) ?? null,
      revokedAt: (r.revoked_at as string | null) ?? null,
      updatedAt: r.updated_at as string,
      endpointHost: maskEndpointHost(r.endpoint as string),
    };
  });
}
