import { supabase } from "@/integrations/supabase/client";
import type {
  NotificationAudience,
  NotificationChannel,
  NotificationPriority,
  NotificationRecord,
  NotificationStatus,
  NotificationType,
} from "./types";

export type FetchNotificationsOptions = {
  userId: string;
  audience?: NotificationAudience;
  unreadOnly?: boolean;
  limit?: number;
};

function mapRow(row: Record<string, unknown>, readIds: Set<string>): NotificationRecord {
  const id = row.id as string;
  const readAt = (row.read_at as string | null) ?? null;
  const audience = (row.audience as NotificationAudience) ?? "admin";
  return {
    id,
    userId: (row.user_id as string | null) ?? null,
    title: row.title as string,
    body: (row.body as string | null) ?? null,
    channel: row.channel as NotificationChannel,
    status: row.status as NotificationStatus,
    notificationType: (row.notification_type as NotificationType | null) ?? null,
    priority: (row.priority as NotificationPriority) ?? "normal",
    actionUrl: (row.action_url as string | null) ?? null,
    audience,
    entityType: (row.entity_type as string | null) ?? null,
    entityId: (row.entity_id as string | null) ?? null,
    createdAt: row.created_at as string,
    readAt,
    isRead: readIds.has(id) || (audience === "user" && readAt !== null),
  };
}

async function fetchReadIds(userId: string, notificationIds: string[]) {
  if (notificationIds.length === 0) return new Set<string>();
  const { data, error } = await supabase
    .from("notification_reads")
    .select("notification_id")
    .eq("user_id", userId)
    .in("notification_id", notificationIds);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.notification_id as string));
}

export async function fetchAdminNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number },
): Promise<NotificationRecord[]> {
  return fetchNotifications({
    userId,
    audience: "admin",
    unreadOnly: options?.unreadOnly,
    limit: options?.limit ?? 50,
  });
}

export async function fetchNotifications(options: FetchNotificationsOptions): Promise<NotificationRecord[]> {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("audience", options.audience ?? "admin")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);

  if (options.audience === "user") {
    query = query.eq("user_id", options.userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const readIds = await fetchReadIds(
    options.userId,
    rows.map((row) => row.id as string),
  );

  let mapped = rows.map((row) => mapRow(row as Record<string, unknown>, readIds));
  if (options.unreadOnly) mapped = mapped.filter((n) => !n.isRead);
  return mapped;
}

export async function getAdminUnreadCount(userId: string): Promise<number> {
  const notifications = await fetchAdminNotifications(userId, { limit: 200 });
  return notifications.filter((n) => !n.isRead).length;
}

/** @deprecated Use getAdminUnreadCount for Command Center */
export async function getUnreadCount(userId?: string) {
  if (!userId) return 0;
  return getAdminUnreadCount(userId);
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const now = new Date().toISOString();
  const { error: readError } = await supabase.from("notification_reads").upsert(
    {
      notification_id: notificationId,
      user_id: userId,
      read_at: now,
    },
    { onConflict: "notification_id,user_id" },
  );
  if (readError) throw readError;

  const { data: notification, error: fetchError } = await supabase
    .from("notifications")
    .select("audience, user_id")
    .eq("id", notificationId)
    .maybeSingle();
  if (fetchError) throw fetchError;

  if (notification?.audience === "user" && notification.user_id === userId) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now, status: "read" })
      .eq("id", notificationId);
    if (error) throw error;
  }
}

export async function markAllNotificationsRead(userId: string, audience: NotificationAudience = "admin") {
  const notifications = await fetchNotifications({ userId, audience, limit: 200 });
  const unread = notifications.filter((n) => !n.isRead);
  if (unread.length === 0) return;

  const now = new Date().toISOString();
  const { error: readError } = await supabase.from("notification_reads").upsert(
    unread.map((n) => ({
      notification_id: n.id,
      user_id: userId,
      read_at: now,
    })),
    { onConflict: "notification_id,user_id" },
  );
  if (readError) throw readError;

  if (audience === "user") {
    const userUnreadIds = unread.filter((n) => n.userId === userId).map((n) => n.id);
    if (userUnreadIds.length > 0) {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: now, status: "read" })
        .in("id", userUnreadIds);
      if (error) throw error;
    }
  }
}

export async function createNotification(input: {
  userId?: string;
  title: string;
  body?: string;
  channel?: NotificationChannel;
  notificationType?: NotificationType;
  priority?: NotificationPriority;
  actionUrl?: string;
  audience?: NotificationAudience;
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
      status: "sent",
      notification_type: input.notificationType ?? null,
      priority: input.priority ?? "normal",
      action_url: input.actionUrl ?? null,
      audience: input.audience ?? (input.userId ? "user" : "admin"),
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>, new Set());
}
