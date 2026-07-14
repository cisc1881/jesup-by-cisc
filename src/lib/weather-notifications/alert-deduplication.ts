import type { WeatherSeverity } from "@/lib/weather/types";
import type {
  AlertDeliveryDecision,
  MappedNwsAlertForDelivery,
  ProcessedWeatherAlertRecord,
  WeatherNotificationPreferences,
} from "./types";
import { isQuietHoursActive, shouldBypassQuietHours } from "./quiet-hours";
import { severityPreferenceEnabled } from "./preferences-matching";

export function isAlertExpired(expiresAt: string, now: Date = new Date()): boolean {
  const expires = new Date(expiresAt);
  return Number.isNaN(expires.getTime()) || expires.getTime() <= now.getTime();
}

export function isAlertActive(alert: MappedNwsAlertForDelivery, now: Date = new Date()): boolean {
  const effective = new Date(alert.effectiveAt);
  if (Number.isNaN(effective.getTime())) return false;
  if (effective.getTime() > now.getTime()) return false;
  return !isAlertExpired(alert.expiresAt, now);
}

export function isDuplicateProcessedAlert(
  processed: Pick<ProcessedWeatherAlertRecord, "nwsAlertId">[] | undefined,
  nwsAlertId: string,
): boolean {
  return (processed ?? []).some((row) => row.nwsAlertId === nwsAlertId);
}

export function evaluateAlertDelivery(
  preferences: WeatherNotificationPreferences,
  alert: MappedNwsAlertForDelivery,
  processedForUser: Pick<ProcessedWeatherAlertRecord, "nwsAlertId">[] | undefined,
  now: Date = new Date(),
): AlertDeliveryDecision {
  if (!preferences.enabled) {
    return { action: "suppress", reason: "Notifications disabled by user." };
  }

  if (!isAlertActive(alert, now)) {
    return { action: "suppress", reason: "Alert is not active or has expired." };
  }

  if (isDuplicateProcessedAlert(processedForUser, alert.id)) {
    return { action: "suppress", reason: "Alert already processed for this user." };
  }

  if (!severityPreferenceEnabled(preferences, alert.severity)) {
    return { action: "suppress", reason: `${alert.severity} alerts are disabled in preferences.` };
  }

  if (
    preferences.quietHoursEnabled &&
    isQuietHoursActive(preferences, now) &&
    !shouldBypassQuietHours(alert.severity)
  ) {
    return { action: "delay", reason: "Quiet hours active for non-emergency alert." };
  }

  return { action: "send" };
}
