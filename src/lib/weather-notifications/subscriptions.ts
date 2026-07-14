import { supabase } from "@/integrations/supabase/client";
import { normalizePushSubscriptionJson } from "./subscription-normalize";
import type { PushSubscriptionInput, PushSubscriptionRecord } from "./types";

function pushSubsTable() {
  return (
    supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> }
  ).from("push_subscriptions");
}

function mapRow(row: Record<string, unknown>): PushSubscriptionRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    endpoint: row.endpoint as string,
    p256dh: row.p256dh as string,
    auth: row.auth as string,
    userAgent: (row.user_agent as string | null) ?? null,
    deviceLabel: (row.device_label as string | null) ?? null,
    isActive: Boolean(row.is_active),
    lastSuccessAt: (row.last_success_at as string | null) ?? null,
    failureCount: Number(row.failure_count ?? 0),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    revokedAt: (row.revoked_at as string | null) ?? null,
  };
}

export async function listPushSubscriptions(userId: string): Promise<PushSubscriptionRecord[]> {
  const { data, error } = await pushSubsTable()
    .select("*")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function subscribeDevice(
  userId: string,
  input: PushSubscriptionInput,
): Promise<PushSubscriptionRecord> {
  const normalized = normalizePushSubscriptionJson(
    { endpoint: input.endpoint, keys: { p256dh: input.p256dh, auth: input.auth } },
    { userAgent: input.userAgent, deviceLabel: input.deviceLabel },
  );
  if (!normalized) throw new Error("Invalid push subscription payload.");

  const payload = {
    user_id: userId,
    endpoint: normalized.endpoint,
    p256dh: normalized.p256dh,
    auth: normalized.auth,
    user_agent: normalized.userAgent ?? null,
    device_label: normalized.deviceLabel ?? null,
    is_active: true,
    failure_count: 0,
    revoked_at: null,
  };

  const { data, error } = await pushSubsTable()
    .upsert(payload, { onConflict: "endpoint" })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function unsubscribeBrowserPush(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  await subscription?.unsubscribe();
}

export async function unsubscribeDevice(userId: string, subscriptionId: string): Promise<void> {
  await unsubscribeBrowserPush();

  const { error } = await pushSubsTable()
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("id", subscriptionId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deactivateFailedSubscription(
  subscriptionId: string,
  reason?: string,
): Promise<void> {
  const { error } = await pushSubsTable()
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      failure_count: 999,
      device_label: reason ? `deactivated: ${reason}` : undefined,
    })
    .eq("id", subscriptionId);

  if (error) throw error;
}

export async function recordSubscriptionFailure(subscriptionId: string): Promise<void> {
  const { data, error: readError } = await pushSubsTable()
    .select("failure_count")
    .eq("id", subscriptionId)
    .single();

  if (readError) throw readError;

  const nextCount = Number((data as { failure_count?: number }).failure_count ?? 0) + 1;
  const updates: Record<string, unknown> = { failure_count: nextCount };
  if (nextCount >= 5) {
    updates.is_active = false;
    updates.revoked_at = new Date().toISOString();
  }

  const { error } = await pushSubsTable().update(updates).eq("id", subscriptionId);
  if (error) throw error;
}
