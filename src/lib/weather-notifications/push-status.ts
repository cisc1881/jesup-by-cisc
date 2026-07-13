import type { PushPermissionState, WeatherNotificationCtaStatus } from "./types";

export function resolvePushNotificationStatus(params: {
  user: unknown | null;
  isSupported: boolean;
  permission: PushPermissionState;
  preferences: { enabled: boolean } | null;
}): WeatherNotificationCtaStatus {
  if (!params.user) return "signed-out";
  if (!params.isSupported) return "unsupported";
  if (params.permission === "denied") return "permission-denied";
  if (params.preferences?.enabled) return "subscribed";
  return "not-subscribed";
}
