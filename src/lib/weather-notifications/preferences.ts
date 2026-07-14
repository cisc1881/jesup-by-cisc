import { supabase } from "@/integrations/supabase/client";
import type { WeatherNotificationPreferences, WeatherNotificationPreferencesInput } from "./types";

function weatherPrefsTable() {
  return (
    supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> }
  ).from("weather_notification_preferences");
}

function mapRow(row: Record<string, unknown>): WeatherNotificationPreferences {
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

export function defaultWeatherNotificationPreferences(
  userId: string,
): WeatherNotificationPreferencesInput {
  return {
    enabled: false,
    alertsEnabled: true,
    watchesEnabled: true,
    warningsEnabled: true,
    emergenciesEnabled: true,
    dailyForecastEnabled: false,
    locationSource: null,
    countyName: null,
    stateCode: null,
    latitudeBucket: null,
    longitudeBucket: null,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago",
  };
}

export async function getWeatherNotificationPreferences(
  userId: string,
): Promise<WeatherNotificationPreferences | null> {
  const { data, error } = await weatherPrefsTable().select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function saveWeatherNotificationPreferences(
  userId: string,
  input: WeatherNotificationPreferencesInput,
): Promise<WeatherNotificationPreferences> {
  const payload = {
    user_id: userId,
    enabled: input.enabled,
    alerts_enabled: input.alertsEnabled,
    watches_enabled: input.watchesEnabled,
    warnings_enabled: input.warningsEnabled,
    emergencies_enabled: input.emergenciesEnabled,
    daily_forecast_enabled: input.dailyForecastEnabled,
    location_source: input.locationSource,
    county_name: input.countyName,
    state_code: input.stateCode,
    latitude_bucket: input.latitudeBucket,
    longitude_bucket: input.longitudeBucket,
    quiet_hours_enabled: input.quietHoursEnabled,
    quiet_hours_start: input.quietHoursStart,
    quiet_hours_end: input.quietHoursEnd,
    timezone: input.timezone,
    last_alert_checked_at: input.lastAlertCheckedAt ?? null,
  };

  const existing = await getWeatherNotificationPreferences(userId);

  if (existing) {
    const { data, error } = await weatherPrefsTable()
      .update(payload)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  }

  const { data, error } = await weatherPrefsTable().insert(payload).select("*").single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}
