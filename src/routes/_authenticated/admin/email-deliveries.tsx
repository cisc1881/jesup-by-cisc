import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommandCenterContentShell, CommandCenterPageHeader } from "@/modules/admin";
import {
  listEmailDeliveries,
  retryEmailDelivery,
  retryFailedEmailDeliveries,
  type EmailDeliveryStatus,
} from "@/lib/email-deliveries";
import { fmtDateTime } from "@/lib/format";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/email-deliveries")({
  component: AdminEmailDeliveries,
});

const STATUSES: Array<{ value: "all" | EmailDeliveryStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Queued" },
  { value: "processing", label: "Processing" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
];

const STATUS_VARIANT: Record<
  EmailDeliveryStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  processing: "outline",
  sent: "default",
  failed: "destructive",
};

function AdminEmailDeliveries() {
  const [filter, setFilter] = useState<"all" | EmailDeliveryStatus>("all");
  const queryClient = useQueryClient();
  const queryKey = ["admin-email-deliveries", filter];
  const {
    data: deliveries = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey,
    queryFn: () => listEmailDeliveries(filter === "all" ? undefined : filter),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-email-deliveries"] });
  const retryOne = useMutation({
    mutationFn: retryEmailDelivery,
    onSuccess: () => {
      toast.success("Email queued for retry");
      void refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const retryAll = useMutation({
    mutationFn: retryFailedEmailDeliveries,
    onSuccess: () => {
      toast.success("Failed emails queued for retry");
      void refresh();
    },
    onError: (error) => toast.error(error.message),
  });
  const failedCount = deliveries.filter((delivery) => delivery.status === "failed").length;

  return (
    <CommandCenterContentShell>
      <CommandCenterPageHeader
        title="Email Delivery"
        description="Monitor confirmation delivery, inspect failures, and retry queued messages."
        actions={
          failedCount > 0 ? (
            <Button
              variant="outline"
              onClick={() => retryAll.mutate()}
              disabled={retryAll.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retry failed
            </Button>
          ) : undefined
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map((status) => (
          <Button
            key={status.value}
            size="sm"
            variant={filter === status.value ? "default" : "outline"}
            onClick={() => setFilter(status.value)}
          >
            {status.label}
          </Button>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">Loading email deliveries…</p>}
      {isError && <p className="text-destructive">Email delivery history could not be loaded.</p>}
      {!isLoading && !isError && deliveries.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="grid place-items-center gap-3 py-12 text-center text-muted-foreground">
            <Mail className="h-8 w-8" />
            <p>No {filter === "all" ? "email deliveries" : `${filter} messages`} yet.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {deliveries.map((delivery) => (
          <Card key={delivery.id}>
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{delivery.subject}</p>
                  <Badge variant={STATUS_VARIANT[delivery.status]}>{delivery.status}</Badge>
                </div>
                <p className="break-all text-sm text-muted-foreground">{delivery.recipient}</p>
                <p className="text-sm text-muted-foreground">{delivery.body}</p>
                <p className="text-xs text-muted-foreground">
                  Queued {fmtDateTime(delivery.created_at)} · Attempts {delivery.attempts}
                  {delivery.sent_at ? ` · Sent ${fmtDateTime(delivery.sent_at)}` : ""}
                </p>
                {delivery.last_error && (
                  <p
                    className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                    role="alert"
                  >
                    {delivery.last_error}
                  </p>
                )}
              </div>
              {(delivery.status === "failed" || delivery.status === "pending") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => retryOne.mutate(delivery.id)}
                  disabled={retryOne.isPending}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Retry
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </CommandCenterContentShell>
  );
}
