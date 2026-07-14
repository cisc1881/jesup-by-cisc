import type { WeatherNotificationPreferences } from "./types";

function parseTimeToMinutes(value: string | null): number | null {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function getLocalMinutes(date: Date, timeZone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);

    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    return hour * 60 + minute;
  } catch {
    return date.getHours() * 60 + date.getMinutes();
  }
}

export function isQuietHoursActive(
  preferences: Pick<
    WeatherNotificationPreferences,
    "quietHoursEnabled" | "quietHoursStart" | "quietHoursEnd" | "timezone"
  >,
  now: Date = new Date(),
): boolean {
  if (!preferences.quietHoursEnabled) return false;

  const start = parseTimeToMinutes(preferences.quietHoursStart);
  const end = parseTimeToMinutes(preferences.quietHoursEnd);
  const current = getLocalMinutes(now, preferences.timezone);

  if (start == null || end == null || current == null) return false;
  if (start === end) return false;

  if (start < end) {
    return current >= start && current < end;
  }

  return current >= start || current < end;
}

export function shouldBypassQuietHours(severity: string): boolean {
  return severity === "emergency";
}
