import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { PageHeader, PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { fmtDateTime } from "@/lib/format";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/modules/notifications";

export const Route = createFileRoute("/_authenticated/me/notifications")({
  component: MyNotificationsPage,
  head: () => ({ meta: [{ title: "Notifications · JESUP" }] }),
});

function MyNotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["my-notifications", user?.id];
  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: () => fetchNotifications({ userId: user!.id, audience: "user", limit: 100 }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id, user!.id),
    onSuccess: refresh,
  });
  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id, "user"),
    onSuccess: refresh,
  });
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <PublicLayout>
      <PageHeader
        title="Notifications"
        description="Confirmations and updates from your JESUP activity."
      />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {unreadCount === 0
              ? "You're all caught up."
              : `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`}
          </p>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading && <p className="text-muted-foreground">Loading notifications…</p>}
        {!isLoading && notifications.length === 0 && (
          <Card>
            <CardContent className="grid place-items-center gap-3 py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                Your registrations, applications, and inquiries will appear here.
              </p>
            </CardContent>
          </Card>
        )}

        {notifications.map((notification) => {
          const content = (
            <Card className={notification.isRead ? "" : "border-primary/40 bg-primary/[0.03]"}>
              <CardContent className="flex gap-3 p-5">
                <span
                  className={`mt-2 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-border" : "bg-primary"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{notification.title}</p>
                  {notification.body && (
                    <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {fmtDateTime(notification.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );

          return notification.actionUrl ? (
            <Link
              key={notification.id}
              to={notification.actionUrl}
              onClick={() => !notification.isRead && markOne.mutate(notification.id)}
              className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {content}
            </Link>
          ) : (
            <button
              key={notification.id}
              type="button"
              className="block w-full text-left"
              onClick={() => !notification.isRead && markOne.mutate(notification.id)}
            >
              {content}
            </button>
          );
        })}
      </div>
    </PublicLayout>
  );
}
