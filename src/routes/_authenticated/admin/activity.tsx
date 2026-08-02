import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CommandCenterContentShell,
  CommandCenterPageHeader,
  fetchCommandCenterDashboard,
  type CommandCenterActivityItem,
  type CommandCenterActivityType,
} from "@/modules/admin";
import { Card, CardContent } from "@/components/ui/card";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/activity")({ component: AdminActivity });

const ACTIVITY_LABELS: Record<CommandCenterActivityType, string> = {
  event_registration: "Event registration",
  twofas_application: "2FAS application",
  publication: "Publication",
  program: "Program",
  market: "Market",
};

function ActivityRow({ item }: { item: CommandCenterActivityItem }) {
  return (
    <Link
      to={item.linkTo}
      className="flex items-start justify-between gap-3 rounded-lg px-2 py-2.5 transition hover:bg-secondary/60"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground">
          {ACTIVITY_LABELS[item.type]}
          {item.subtitle ? ` · ${item.subtitle}` : ""}
        </p>
      </div>
      <time className="shrink-0 text-xs text-muted-foreground">{fmtDateTime(item.timestamp)}</time>
    </Link>
  );
}

function AdminActivity() {
  const { data, isLoading } = useQuery({
    queryKey: ["command-center-dashboard"],
    queryFn: fetchCommandCenterDashboard,
  });

  const activity = data?.recentActivity ?? [];

  return (
    <CommandCenterContentShell>
      <CommandCenterPageHeader
        title="Activity"
        description="Recent platform activity across registrations, applications, and content updates."
      />

      <Card>
        <CardContent className="p-4">
          {isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Loading activity…</p>}
          {!isLoading && activity.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No recent activity yet.</p>
          )}
          <div className="divide-y divide-border/60">
            {activity.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        </CardContent>
      </Card>
    </CommandCenterContentShell>
  );
}
