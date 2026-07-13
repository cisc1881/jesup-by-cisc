import type { WeatherSeverity } from "@/lib/weather/types";
import type { WeatherNotificationPreferences } from "./types";

export function severityPreferenceEnabled(
  preferences: Pick<
    WeatherNotificationPreferences,
    "alertsEnabled" | "watchesEnabled" | "warningsEnabled" | "emergenciesEnabled"
  >,
  severity: WeatherSeverity,
): boolean {
  if (!preferences.alertsEnabled) return false;

  switch (severity) {
    case "advisory":
      return true;
    case "watch":
      return preferences.watchesEnabled;
    case "warning":
      return preferences.warningsEnabled;
    case "emergency":
      return preferences.emergenciesEnabled;
    default:
      return false;
  }
}
