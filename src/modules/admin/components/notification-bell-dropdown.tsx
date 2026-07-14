import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchAdminNotifications,
  getAdminUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/modules/notifications";
import { DEFAULT_ACTION_URLS, NOTIFICATION_TYPE_LABELS } from "@/modules/notifications/types";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NotificationBellDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread-count", user?.id],
    enabled: !!user,
    queryFn: () => getAdminUnreadCount(user!.id),
    refetchInterval: 60_000,
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications-dropdown", user?.id],
    enabled: !!user,
    queryFn: () => fetchAdminNotifications(user!.id, { limit: 8 }),
  });

  async function handleMarkRead(id: string) {
    if (!user) return;
    await markNotificationRead(id, user.id);
    qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    qc.invalidateQueries({ queryKey: ["notifications-dropdown"] });
    qc.invalidateQueries({ queryKey: ["notifications-center"] });
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllNotificationsRead(user.id, "admin");
    qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    qc.invalidateQueries({ queryKey: ["notifications-dropdown"] });
    qc.invalidateQueries({ queryKey: ["notifications-center"] });
  }

  function openNotification(
    actionUrl: string | null,
    type: keyof typeof DEFAULT_ACTION_URLS | null,
    id: string,
    entityId: string | null,
  ) {
    if (user) void handleMarkRead(id);
    if (type === "inquiry_received" && entityId) {
      navigate({ to: "/admin/inquiries", search: { id: entityId } });
      return;
    }
    const target = actionUrl ?? (type ? DEFAULT_ACTION_URLS[type] : "/admin/notifications");
    navigate({ to: target });
  }

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative shrink-0" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(100vw-2rem,24rem)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => void handleMarkAllRead()}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading && <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && notifications.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              className={cn(
                "w-full border-b px-4 py-3 text-left transition hover:bg-secondary/60",
                !n.isRead && "bg-primary/5",
              )}
              onClick={() => openNotification(n.actionUrl, n.notificationType, n.id, n.entityId)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{n.title}</p>
                {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </div>
              {n.body && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                {n.notificationType && <span>{NOTIFICATION_TYPE_LABELS[n.notificationType]}</span>}
                <span>{fmtDateTime(n.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link to="/admin/notifications">Open Notification Center</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
