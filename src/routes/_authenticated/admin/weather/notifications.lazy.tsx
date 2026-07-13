import type { ReactNode } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  deactivateFailedSubscription,
  fetchAdminWeatherNotificationSummary,
  listAdminFailedPushSubscriptions,
} from "@/lib/weather-notifications";
import { Bell, BellOff, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createLazyFileRoute("/_authenticated/admin/weather/notifications")({
  component: AdminWeatherNotifications,
});

function AdminWeatherNotifications() {
  const qc = useQueryClient();

  const { data: summary } = useQuery({
    queryKey: ["admin-weather-notification-summary"],
    queryFn: fetchAdminWeatherNotificationSummary,
  });

  const { data: failedSubs } = useQuery({
    queryKey: ["admin-weather-failed-subscriptions"],
    queryFn: listAdminFailedPushSubscriptions,
  });

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["admin-weather-notification-summary"] });
    qc.invalidateQueries({ queryKey: ["admin-weather-failed-subscriptions"] });
  }

  async function deactivateSubscription(id: string) {
    try {
      await deactivateFailedSubscription(id, "admin manual deactivate");
      invalidateAll();
      toast.success("Subscription deactivated");
    } catch {
      toast.error("Could not deactivate subscription");
    }
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Weather notification subscriptions"
        description="Inspect opt-in severe weather alert preferences and device subscriptions. No broadcast controls in Phase 1."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Enabled users"
          value={summary?.enabledUsers ?? 0}
          icon={<Bell className="size-4" />}
        />
        <SummaryCard
          title="Active subscriptions"
          value={summary?.activeSubscriptions ?? 0}
          icon={<ShieldAlert className="size-4" />}
        />
        <SummaryCard
          title="Failed / inactive"
          value={summary?.failedSubscriptions ?? 0}
          icon={<BellOff className="size-4" />}
        />
        <SummaryCard
          title="Processed (7 days)"
          value={summary?.processedAlertsLast7Days ?? 0}
          icon={<ShieldAlert className="size-4" />}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Subscriptions needing attention</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Endpoint host</TableHead>
                <TableHead>Failures</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(failedSubs ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No failed or inactive subscriptions.
                  </TableCell>
                </TableRow>
              ) : null}
              {(failedSubs ?? []).map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.deviceLabel ?? "Unknown device"}</TableCell>
                  <TableCell className="font-mono text-xs">{sub.endpointHost}</TableCell>
                  <TableCell>{sub.failureCount}</TableCell>
                  <TableCell>
                    <Badge variant={sub.isActive ? "secondary" : "destructive"}>
                      {sub.isActive ? "active (failures)" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!sub.isActive}
                      onClick={() => void deactivateSubscription(sub.id)}
                    >
                      Deactivate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently processed alerts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(summary?.recentProcessedAlerts ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No processed alerts yet.
                  </TableCell>
                </TableRow>
              ) : null}
              {(summary?.recentProcessedAlerts ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.eventName}</TableCell>
                  <TableCell>{row.severity}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.deliveryStatus}</Badge>
                  </TableCell>
                  <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Subscription keys (p256dh, auth) and VAPID secrets are never displayed. Manual broadcast is not available in Sprint 11 Phase 1.
      </p>
    </AdminShell>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className="text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  );
}
