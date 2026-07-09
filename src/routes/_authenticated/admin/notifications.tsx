import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CommandCenterContentShell, CommandCenterPageHeader } from "@/modules/admin";
import { fetchNotifications, markNotificationRead, createNotification } from "@/modules/notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bell, Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/notifications")({ component: AdminNotifications });

function AdminNotifications() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(),
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createNotification({ title: title.trim(), body: body.trim() || undefined });
      toast.success("Notification created");
      setTitle("");
      setBody("");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create notification");
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  return (
    <CommandCenterContentShell>
      <CommandCenterPageHeader
        title="Notification Center"
        description="Manage in-app notifications. Future support for push, email, and SMS delivery."
      />

      <Card className="mb-6">
        <CardContent className="p-6">
          <form onSubmit={handleCreate} className="space-y-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <Plus className="h-4 w-4" /> Create notification
            </h2>
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label>Body</Label>
              <Input value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <Button type="submit">Send in-app notification</Button>
          </form>
        </CardContent>
      </Card>

      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Bell className="h-4 w-4" />
        Channels: in-app (active) · email · SMS · push (coming soon)
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="space-y-3">
        {(notifications ?? []).map((n) => (
          <Card key={n.id} className={n.readAt ? "opacity-60" : ""}>
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div>
                <div className="font-medium text-foreground">{n.title}</div>
                {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  <span>{n.channel}</span>
                  <span>{n.status}</span>
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>
              {!n.readAt && (
                <Button variant="outline" size="sm" onClick={() => handleMarkRead(n.id)}>
                  Mark read
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {!isLoading && (notifications ?? []).length === 0 && (
        <p className="py-12 text-center text-muted-foreground">No notifications yet.</p>
      )}
    </CommandCenterContentShell>
  );
}
