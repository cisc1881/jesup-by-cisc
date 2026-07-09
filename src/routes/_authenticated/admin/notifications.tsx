import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CommandCenterContentShell, CommandCenterPageHeader } from "@/modules/admin";
import {
  fetchAdminNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/modules/notifications";
import { DEFAULT_ACTION_URLS, NOTIFICATION_TYPE_LABELS } from "@/modules/notifications/types";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/notifications")({ component: AdminNotifications });

type FilterMode = "all" | "unread";

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "outline",
  normal: "secondary",
  high: "default",
  urgent: "destructive",
};

function AdminNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterMode>("all");

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications-center", user?.id, filter],
    enabled: !!user,
    queryFn: () =>
      fetchAdminNotifications(user!.id, {
        unreadOnly: filter === "unread",
        limit: 100,
      }),
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  function refresh() {
    qc.invalidateQueries({ queryKey: ["notifications-center"] });
    qc.invalidateQueries({ queryKey: ["notifications-dropdown"] });
    qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
  }

  async function handleMarkRead(id: string) {
    if (!user) return;
    try {
      await markNotificationRead(id, user.id);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark as read");
    }
  }

  async function handleMarkAllRead() {
    if (!user) return;
    try {
      await markAllNotificationsRead(user.id, "admin");
      toast.success("All notifications marked as read");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark all as read");
    }
  }

  function openNotification(
    actionUrl: string | null,
    type: keyof typeof DEFAULT_ACTION_URLS | null,
    id: string,
    isRead: boolean,
  ) {
    if (!isRead && user) void handleMarkRead(id);
    const target = actionUrl ?? (type ? DEFAULT_ACTION_URLS[type] : "/admin");
    navigate({ to: target });
  }

  return (
    <CommandCenterContentShell>
      <CommandCenterPageHeader
        title="Notification Center"
        description="In-app alerts for Command Center activity. Email, SMS, and push delivery coming later."
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={() => void handleMarkAllRead()}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          className={filter === "all" ? "bg-primary hover:bg-primary/90" : undefined}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={filter === "unread" ? "default" : "outline"}
          className={filter === "unread" ? "bg-primary hover:bg-primary/90" : undefined}
          onClick={() => setFilter("unread")}
        >
          Unread
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading notifications…</p>}

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={cn(
              "border-0 shadow-token-soft transition hover:shadow-token-lift",
              !n.isRead && "ring-1 ring-primary/15",
            )}
          >
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => openNotification(n.actionUrl, n.notificationType, n.id, n.isRead)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                  <span className="font-medium text-foreground">{n.title}</span>
                  {n.notificationType && (
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {NOTIFICATION_TYPE_LABELS[n.notificationType]}
                    </Badge>
                  )}
                  <Badge variant={PRIORITY_VARIANT[n.priority] ?? "secondary"} className="text-[10px] uppercase">
                    {n.priority}
                  </Badge>
                </div>
                {n.body && <p className="mt-2 text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-2 text-xs text-muted-foreground">{fmtDateTime(n.createdAt)}</p>
              </button>
              <div className="flex shrink-0 gap-2">
                {!n.isRead && (
                  <Button variant="outline" size="sm" onClick={() => void handleMarkRead(n.id)}>
                    Mark read
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    to={n.actionUrl ?? (n.notificationType ? DEFAULT_ACTION_URLS[n.notificationType] : "/admin")}
                  >
                    Open
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && notifications.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            {filter === "unread" ? "No unread notifications." : "No notifications yet."}
          </CardContent>
        </Card>
      )}
    </CommandCenterContentShell>
  );
}
