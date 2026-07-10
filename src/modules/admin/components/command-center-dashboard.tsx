import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  CalendarPlus,
  ClipboardList,
  GraduationCap,
  LayoutGrid,
  MapPin,
  MapPinPlus,
  MessageSquare,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import { EventFormDialog } from "@/components/admin/event-form-dialog";
import { MarketFormDialog } from "@/components/admin/market-form-dialog";
import { ProgramFormDialog } from "@/components/admin/program-form-dialog";
import { QuickActionTile } from "@/components/design-system/quick-action-tile";
import { QueryErrorState } from "@/components/design-system/query-error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  COMMAND_CENTER_SUBTITLE,
  COMMAND_CENTER_TITLE,
} from "../config/nav-items";
import type { CommandCenterMetrics } from "../services/command-center-dashboard";
import {
  fetchCommandCenterDashboard,
  type CommandCenterActivityItem,
  type CommandCenterActivityType,
  type CommandCenterPendingItem,
  type CommandCenterPendingType,
} from "../services/command-center-dashboard";
import { fmtDateTime } from "@/lib/format";

const METRIC_CARDS: {
  key: keyof CommandCenterMetrics;
  label: string;
  icon: LucideIcon;
  to: string;
}[] = [
  { key: "activePrograms", label: "Active Programs", icon: LayoutGrid, to: "/admin/programs" },
  { key: "upcomingEvents", label: "Upcoming Events", icon: Calendar, to: "/admin/events" },
  { key: "activeMarkets", label: "Active Markets", icon: MapPin, to: "/admin/markets" },
  { key: "publications", label: "Publications", icon: BookOpen, to: "/admin/publications" },
  { key: "pending2fasApplications", label: "Pending 2FAS Applications", icon: GraduationCap, to: "/admin/2fas/applications" },
  { key: "newInquiries", label: "New Inquiries", icon: MessageSquare, to: "/admin/inquiries" },
  { key: "eventRegistrations", label: "Event Registrations", icon: ClipboardList, to: "/admin/events" },
];

const QUICK_MANAGEMENT: { label: string; to: string; icon: LucideIcon }[] = [
  { label: "Programs", to: "/admin/programs", icon: LayoutGrid },
  { label: "Publications", to: "/admin/publications", icon: BookOpen },
  { label: "Events", to: "/admin/events", icon: Calendar },
  { label: "Markets", to: "/admin/markets", icon: MapPin },
  { label: "2FAS Applications", to: "/admin/2fas/applications", icon: GraduationCap },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

const ACTIVITY_LABELS: Record<CommandCenterActivityType, string> = {
  event_registration: "Event registration",
  twofas_application: "2FAS application",
  publication: "Publication",
  program: "Program",
  market: "Market",
};

const PENDING_LABELS: Record<CommandCenterPendingType, string> = {
  twofas_application: "2FAS application",
  low_capacity_event: "Low capacity",
  event_registration: "Registration",
};

function MetricCard({
  label,
  value,
  icon: Icon,
  to,
  isLoading,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  to: string;
  isLoading?: boolean;
}) {
  return (
    <Link to={to} className="group block">
      <Card className="h-full border-0 bg-card shadow-token-soft transition hover:-translate-y-0.5 hover:shadow-token-lift">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="gold-bar" />
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/8 text-primary transition group-hover:grad-crimson group-hover:text-primary-foreground">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <div className="font-serif text-3xl font-bold text-primary">{value.toLocaleString()}</div>
          )}
          <p className="mt-1 text-sm font-medium text-muted-foreground">{label}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

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

function PendingRow({ item }: { item: CommandCenterPendingItem }) {
  return (
    <Link
      to={item.linkTo}
      className="flex items-start justify-between gap-3 rounded-lg px-2 py-2.5 transition hover:bg-secondary/60"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground">
          {PENDING_LABELS[item.type]}
          {item.subtitle ? ` · ${item.subtitle}` : ""}
        </p>
      </div>
      {item.meta && (
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          {item.meta}
        </span>
      )}
    </Link>
  );
}

export function CommandCenterDashboard() {
  const qc = useQueryClient();
  const [programOpen, setProgramOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["command-center-dashboard"],
    queryFn: fetchCommandCenterDashboard,
  });

  function refreshDashboard() {
    void refetch();
    qc.invalidateQueries({ queryKey: ["command-center-counts"] });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-2xl grad-crimson p-6 text-primary-foreground shadow-token-crimson sm:p-8">
        <div className="relative z-10">
          <span className="gold-bar mb-4" />
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">{COMMAND_CENTER_TITLE}</h1>
          <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">{COMMAND_CENTER_SUBTITLE}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="min-h-[44px] bg-white/15 text-primary-foreground hover:bg-white/25"
              onClick={refreshDashboard}
              disabled={isFetching}
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="min-h-[44px] bg-white/15 text-primary-foreground hover:bg-white/25"
              onClick={() => setProgramOpen(true)}
            >
              <LayoutGrid className="mr-1.5 h-4 w-4" />
              Add Program
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/15 text-primary-foreground hover:bg-white/25"
              onClick={() => setEventOpen(true)}
            >
              <CalendarPlus className="mr-1.5 h-4 w-4" />
              Add Event
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/15 text-primary-foreground hover:bg-white/25"
              onClick={() => setMarketOpen(true)}
            >
              <MapPinPlus className="mr-1.5 h-4 w-4" />
              Add Market
            </Button>
            <Button size="sm" variant="secondary" className="bg-white/15 text-primary-foreground hover:bg-white/25" asChild>
              <Link to="/admin/2fas/applications">
                <GraduationCap className="mr-1.5 h-4 w-4" />
                Review 2FAS Applications
              </Link>
            </Button>
          </div>
        </div>
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          aria-hidden="true"
        />
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          <span className="gold-bar" />
          Platform metrics
        </h2>
        {isError ? (
          <QueryErrorState title="Couldn't load dashboard metrics" onRetry={() => refetch()} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {METRIC_CARDS.map((card) => (
              <MetricCard
                key={card.key}
                label={card.label}
                value={data?.metrics[card.key] ?? 0}
                icon={card.icon}
                to={card.to}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 bg-card shadow-token-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <span className="gold-bar" />
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {isLoading && (
              <div className="space-y-3 py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            )}
            {isError && !isLoading && (
              <p className="py-6 text-center text-sm text-muted-foreground">Activity unavailable.</p>
            )}
            {!isLoading && !isError && (data?.recentActivity.length ?? 0) === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No recent activity yet.</p>
            )}
            {(data?.recentActivity ?? []).map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-card shadow-token-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <span className="gold-bar" />
              Pending review
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {isLoading && (
              <div className="space-y-3 py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            )}
            {isError && !isLoading && (
              <p className="py-6 text-center text-sm text-muted-foreground">Review queue unavailable.</p>
            )}
            {!isLoading && !isError && (data?.pendingReview.length ?? 0) === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Nothing needs review right now.</p>
            )}
            {(data?.pendingReview ?? []).map((item) => (
              <PendingRow key={item.id} item={item} />
            ))}
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          <span className="gold-bar" />
          Quick management
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {QUICK_MANAGEMENT.map((item) => (
            <QuickActionTile key={item.to} to={item.to} label={item.label} icon={item.icon} />
          ))}
        </div>
      </section>

      <ProgramFormDialog
        open={programOpen}
        onOpenChange={setProgramOpen}
        programId={null}
        onSaved={() => {
          setProgramOpen(false);
          refreshDashboard();
        }}
      />
      <EventFormDialog
        open={eventOpen}
        onOpenChange={setEventOpen}
        eventId={null}
        onSaved={() => {
          setEventOpen(false);
          refreshDashboard();
        }}
      />
      <MarketFormDialog
        open={marketOpen}
        onOpenChange={setMarketOpen}
        marketId={null}
        onSaved={() => {
          setMarketOpen(false);
          refreshDashboard();
        }}
      />
    </div>
  );
}
