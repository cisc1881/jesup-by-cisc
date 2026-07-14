import type { SupabaseClient } from "@supabase/supabase-js";
import type { MappedNwsAlertForDelivery, WeatherDelayedDeliveryStatus } from "./types";
import { isAlertExpired } from "./alert-deduplication";
import { deliverAlertToUserDevices } from "./delivery";

type AdminDb = SupabaseClient;

function delayedTable(db: AdminDb) {
  return (db as unknown as { from: (table: string) => ReturnType<AdminDb["from"]> }).from(
    "weather_alert_delayed_deliveries",
  );
}

export type DelayedDeliveryRecord = {
  id: string;
  userId: string;
  nwsAlertId: string;
  severity: string;
  eventName: string;
  expiresAt: string;
  scheduledFor: string;
  status: WeatherDelayedDeliveryStatus;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapDelayedRow(row: Record<string, unknown>): DelayedDeliveryRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    nwsAlertId: row.nws_alert_id as string,
    severity: row.severity as string,
    eventName: row.event_name as string,
    expiresAt: row.expires_at as string,
    scheduledFor: row.scheduled_for as string,
    status: row.status as WeatherDelayedDeliveryStatus,
    failureReason: (row.failure_reason as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function computeQuietHoursReleaseTime(
  preferences: { quietHoursEnd: string | null; timezone: string },
  now: Date = new Date(),
): string {
  const end = preferences.quietHoursEnd ?? "07:00";
  const [hours, minutes] = end.split(":").map(Number);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: preferences.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? "1970");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "1") - 1;
  const day = Number(parts.find((p) => p.type === "day")?.value ?? "1");

  const candidate = new Date(Date.UTC(year, month, day, hours, minutes, 0));
  if (candidate.getTime() <= now.getTime()) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }

  return candidate.toISOString();
}

export async function enqueueDelayedDelivery(
  db: AdminDb,
  userId: string,
  alert: MappedNwsAlertForDelivery,
  scheduledFor: string,
): Promise<void> {
  const { error } = await delayedTable(db).upsert(
    {
      user_id: userId,
      nws_alert_id: alert.id,
      severity: alert.severity,
      event_name: alert.eventName,
      expires_at: alert.expiresAt,
      scheduled_for: scheduledFor,
      status: "pending",
      failure_reason: null,
    },
    { onConflict: "user_id,nws_alert_id" },
  );

  if (error) throw error;
}

export async function listDueDelayedDeliveries(
  db: AdminDb,
  now: Date = new Date(),
): Promise<DelayedDeliveryRecord[]> {
  const { data, error } = await delayedTable(db)
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now.toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(200);

  if (error) throw error;
  return (data ?? []).map((row) => mapDelayedRow(row as Record<string, unknown>));
}

export async function markDelayedDeliveryStatus(
  db: AdminDb,
  id: string,
  status: WeatherDelayedDeliveryStatus,
  failureReason?: string,
): Promise<void> {
  const { error } = await delayedTable(db)
    .update({ status, failure_reason: failureReason ?? null })
    .eq("id", id);
  if (error) throw error;
}

export async function processDueDelayedDeliveries(
  db: AdminDb,
  now: Date = new Date(),
): Promise<{ sent: number; expired: number; failed: number }> {
  const due = await listDueDelayedDeliveries(db, now);
  let sent = 0;
  let expired = 0;
  let failed = 0;

  for (const item of due) {
    if (isAlertExpired(item.expiresAt, now)) {
      await markDelayedDeliveryStatus(
        db,
        item.id,
        "expired",
        "Alert expired before quiet hours ended.",
      );
      expired += 1;
      continue;
    }

    const alert: MappedNwsAlertForDelivery = {
      id: item.nwsAlertId,
      severity: item.severity as MappedNwsAlertForDelivery["severity"],
      eventName: item.eventName,
      effectiveAt: item.createdAt,
      expiresAt: item.expiresAt,
    };

    const result = await deliverAlertToUserDevices(db, item.userId, alert);
    if (result.sent > 0) {
      await markDelayedDeliveryStatus(db, item.id, "sent");
      sent += 1;
    } else {
      await markDelayedDeliveryStatus(
        db,
        item.id,
        "failed",
        "Delayed delivery failed for all devices.",
      );
      failed += 1;
    }
  }

  return { sent, expired, failed };
}
