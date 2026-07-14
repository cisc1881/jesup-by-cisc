import type { PushPermissionState, WeatherNotificationCtaStatus } from "./types";
import { isClientVapidConfigured } from "./vapid-config";

export function resolvePushNotificationStatus(params: {
  user: unknown | null;
  isSupported: boolean;
  permission: PushPermissionState;
  preferences: { enabled: boolean } | null;
  activeSubscriptionCount?: number;
  vapidConfigured?: boolean;
  subscriptionAttemptFailed?: boolean;
}): WeatherNotificationCtaStatus {
  if (!params.user) return "signed-out";
  if (!params.isSupported) return "unsupported";
  if (params.permission === "denied") return "permission-denied";
  if (!params.preferences?.enabled) return "not-subscribed";

  const vapidConfigured = params.vapidConfigured ?? isClientVapidConfigured();
  const activeCount = params.activeSubscriptionCount ?? 0;

  if (!vapidConfigured) return "configuration-missing";
  if (params.subscriptionAttemptFailed || (params.permission === "granted" && activeCount === 0)) {
    return "subscription-failed";
  }

  return "subscribed";
}
