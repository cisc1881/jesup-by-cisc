import { supabase } from "@/integrations/supabase/client";
import type { NotificationRecord } from "@/modules/cms";

export async function fetchNotifications(options?: { userId?: string; unreadOnly?: boolean }) {
  let query = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  if (options?.userId) query = query.eq("user_id", options.userId);
  if (options?.unreadOnly) query = query.is("read_at", null);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function createNotification(input: {
  userId?: string;
  title: string;
  body?: string;
  channel?: NotificationRecord["channel"];
  entityType?: string;
  entityId?: string;
}) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.userId ?? null,
      title: input.title,
      body: input.body ?? null,
      channel: input.channel ?? "in_app",
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString(), status: "read" })
    .eq("id", id);
  if (error) throw error;
}

export async function getUnreadCount(userId?: string) {
  let query = supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);
  if (userId) query = query.eq("user_id", userId);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

function mapRow(row: Record<string, unknown>): NotificationRecord {
  return {
    id: row.id as string,
    userId: (row.user_id as string | null) ?? null,
    title: row.title as string,
    body: (row.body as string | null) ?? null,
    channel: row.channel as NotificationRecord["channel"],
    status: row.status as NotificationRecord["status"],
    entityType: (row.entity_type as string | null) ?? null,
    entityId: (row.entity_id as string | null) ?? null,
    createdAt: row.created_at as string,
    readAt: (row.read_at as string | null) ?? null,
  };
}
