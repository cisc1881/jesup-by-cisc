import type { ReactNode } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  deactivateFailedSubscription,
  fetchAdminWeatherNotificationSummary,
  listAdminFailedPushSubscriptions,
} from "@/lib/weather-notifications";
import {
  triggerWeatherAlertPollServerFn,
  formatVapidSetupError,
} from "@/lib/weather-notifications/delivery-server-fn";
import { Bell, BellOff, Clock, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createLazyFileRoute("/_authenticated/admin/weather/notifications")({
  component: AdminWeatherNotifications,
});

function AdminWeatherNotifications() {
  const qc = useQueryClient();

  const { data: summary, isLoading } = useQuery({
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

  async function runPollCycle() {
    try {
      const result = await triggerWeatherAlertPollServerFn();
      invalidateAll();
      toast.success(
        `Poll complete: ${result.deliveriesSent} sent, ${result.deliveriesDelayed} delayed, ${result.deliveriesSuppressed} suppressed.`,
      );
    } catch (error) {
      toast.error(formatVapidSetupError(error));
    }
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Weather notification delivery"
        description="Development observability for opt-in severe weather Web Push. No broadcast controls."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge variant="outline">Development only</Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void runPollCycle()}
          disabled={isLoading}
        >
          <RefreshCw className="mr-2 size-4" />
          Run development poll cycle
        </Button>
      </div>

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
          title="Successful deliveries"
          value={summary?.successfulDeliveries ?? 0}
          icon={<Bell className="size-4" />}
        />
        <SummaryCard
          title="Failed deliveries"
          value={summary?.failedDeliveries ?? 0}
          icon={<BellOff className="size-4" />}
        />
        <SummaryCard
          title="Delayed (pending)"
          value={summary?.delayedAlertsPending ?? 0}
          icon={<Clock className="size-4" />}
        />
        <SummaryCard
          title="Suppressed"
          value={summary?.suppressedAlerts ?? 0}
          icon={<ShieldAlert className="size-4" />}
        />
        <SummaryCard
          title="Deactivated subs"
          value={summary?.deactivatedSubscriptions ?? 0}
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
          <CardTitle>Latest poll run</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {summary?.latestPollRun ? (
            <div className="space-y-1">
              <p>
                Status: <strong className="text-foreground">{summary.latestPollRun.status}</strong>{" "}
                · Started {new Date(summary.latestPollRun.startedAt).toLocaleString()}
              </p>
              <p>
                Groups: {summary.latestPollRun.groupsPolled} · Alerts fetched:{" "}
                {summary.latestPollRun.alertsFetched} · Sent: {summary.latestPollRun.deliveriesSent}{" "}
                · Delayed: {summary.latestPollRun.deliveriesDelayed} · Suppressed:{" "}
                {summary.latestPollRun.deliveriesSuppressed} · Failed:{" "}
                {summary.latestPollRun.deliveriesFailed}
              </p>
              {summary.latestPollRun.errorMessage ? (
                <p className="text-destructive">{summary.latestPollRun.errorMessage}</p>
              ) : null}
            </div>
          ) : (
            <p>No poll runs recorded yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Subscriptions by device</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Endpoint host</TableHead>
                <TableHead>Failures</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(summary?.subscriptionsByDevice ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No subscriptions yet.
                  </TableCell>
                </TableRow>
              ) : null}
              {(summary?.subscriptionsByDevice ?? []).map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.deviceLabel ?? "Unknown device"}</TableCell>
                  <TableCell className="font-mono text-xs">{sub.endpointHost}</TableCell>
                  <TableCell>{sub.failureCount}</TableCell>
                  <TableCell>
                    <Badge variant={sub.isActive ? "secondary" : "destructive"}>
                      {sub.isActive ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Delayed alerts (quiet hours queue)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Scheduled for</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(summary?.delayedAlerts ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No delayed alerts.
                  </TableCell>
                </TableRow>
              ) : null}
              {(summary?.delayedAlerts ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.eventName}</TableCell>
                  <TableCell>{row.severity}</TableCell>
                  <TableCell>{new Date(row.scheduledFor).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.status}</Badge>
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
        Subscription keys (p256dh, auth) and VAPID secrets are never displayed. Manual broadcast is
        not available.
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
