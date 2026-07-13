import { supabase } from "@/integrations/supabase/client";
import type {
  MappedNwsAlertForDelivery,
  ProcessedWeatherAlertRecord,
  WeatherAlertDeliveryStatus,
} from "./types";

function processedAlertsTable() {
  return (supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> }).from(
    "processed_weather_alerts",
  );
}

function mapRow(row: Record<string, unknown>): ProcessedWeatherAlertRecord {
  return {
    id: row.id as string,
    nwsAlertId: row.nws_alert_id as string,
    userId: row.user_id as string,
    severity: row.severity as ProcessedWeatherAlertRecord["severity"],
    eventName: row.event_name as string,
    sentAt: (row.sent_at as string | null) ?? null,
    expiresAt: row.expires_at as string,
    deliveryStatus: row.delivery_status as WeatherAlertDeliveryStatus,
    failureReason: (row.failure_reason as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function listProcessedAlertsForUser(userId: string): Promise<ProcessedWeatherAlertRecord[]> {
  const { data, error } = await processedAlertsTable()
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function isAlertAlreadyProcessed(userId: string, nwsAlertId: string): Promise<boolean> {
  const { data, error } = await processedAlertsTable()
    .select("id")
    .eq("user_id", userId)
    .eq("nws_alert_id", nwsAlertId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function recordProcessedAlert(
  userId: string,
  alert: MappedNwsAlertForDelivery,
  deliveryStatus: WeatherAlertDeliveryStatus,
  options?: { failureReason?: string; sentAt?: string },
): Promise<ProcessedWeatherAlertRecord> {
  const payload = {
    user_id: userId,
    nws_alert_id: alert.id,
    severity: alert.severity,
    event_name: alert.eventName,
    expires_at: alert.expiresAt,
    delivery_status: deliveryStatus,
    failure_reason: options?.failureReason ?? null,
    sent_at: options?.sentAt ?? (deliveryStatus === "sent" || deliveryStatus === "test" ? new Date().toISOString() : null),
  };

  const { data, error } = await processedAlertsTable().insert(payload).select("*").single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}
