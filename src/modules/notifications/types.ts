export type NotificationType =
  | "twofas_application"
  | "event_registration"
  | "event_near_capacity"
  | "publication_added"
  | "equipment_request"
  | "grant_deadline";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type NotificationAudience = "admin" | "user";

export type NotificationChannel = "in_app" | "email" | "sms" | "push";

export type NotificationStatus = "pending" | "sent" | "failed" | "read";

export type NotificationRecord = {
  id: string;
  userId: string | null;
  title: string;
  body: string | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  notificationType: NotificationType | null;
  priority: NotificationPriority;
  actionUrl: string | null;
  audience: NotificationAudience;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  readAt: string | null;
  isRead: boolean;
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  twofas_application: "2FAS application",
  event_registration: "Event registration",
  event_near_capacity: "Event capacity",
  publication_added: "Publication",
  equipment_request: "Equipment request",
  grant_deadline: "Grant deadline",
};

export const DEFAULT_ACTION_URLS: Record<NotificationType, string> = {
  twofas_application: "/admin/2fas/applications",
  event_registration: "/admin/events",
  event_near_capacity: "/admin/events",
  publication_added: "/admin/publications",
  equipment_request: "/admin/equipment",
  grant_deadline: "/admin/grants",
};
