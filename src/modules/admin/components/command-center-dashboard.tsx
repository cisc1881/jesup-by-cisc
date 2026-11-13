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
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EventFormDialog } from "@/components/admin/event-form-dialog";
import { MarketFormDialog } from "@/components/admin/market-form-dialog";
import { ProgramFormDialog } from "@/components/admin/program-form-dialog";
import { QuickActionTile } from "@/components/design-system/quick-action-tile";
import { QueryErrorState } from "@/components/design-system/query-error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { COMMAND_CENTER_SUBTITLE, COMMAND_CENTER_TITLE } from "../config/nav-items";
import type { CommandCenterMetrics } from "../services/command-center-dashboard";
import {
  fetchCommandCenterDashboard,
  type CommandCenterDashboardData,
  type CommandCenterActivityItem,
  type CommandCenterActivityType,
  type CommandCenterPendingItem,
  type CommandCenterPendingType,
} from "../services/command-center-dashboard";
import { fmtDateTime } from "@/lib/format";
import { importStarterContentServerFn } from "../starter-content-server-fn";

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
  {
    key: "pending2fasApplications",
    label: "Pending 2FAS Applications",
    icon: GraduationCap,
    to: "/admin/2fas/applications",
  },
  { key: "newInquiries", label: "New Inquiries", icon: MessageSquare, to: "/admin/inquiries" },
  {
    key: "eventRegistrations",
    label: "Event Registrations",
    icon: ClipboardList,
    to: "/admin/registrations",
  },
];

const QUICK_MANAGEMENT: { label: string; to: string; icon: LucideIcon }[] = [
  { label: "Programs", to: "/admin/programs", icon: LayoutGrid },
  { label: "Publications", to: "/admin/publications", icon: BookOpen },
  { label: "Events", to: "/admin/events", icon: Calendar },
  { label: "Registrations", to: "/admin/registrations", icon: ClipboardList },
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
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/8 text-card-foreground transition group-hover:grad-crimson group-hover:text-primary-foreground">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <div className="font-serif text-3xl font-bold text-card-foreground">
              {value.toLocaleString()}
            </div>
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

function RegistrationInsights({ data }: { data: CommandCenterDashboardData }) {
  const { registrationTrend, registrationFlow, metrics } = data;
  const hasTrend = registrationTrend.some((day) => day.count > 0);
  const checkInRate =
    metrics.eventRegistrations > 0
      ? Math.min(100, Math.round((registrationFlow.checkedIn / metrics.eventRegistrations) * 100))
      : 0;
  return (
    <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]" aria-label="Registration insights">
      <Card className="border border-border bg-card shadow-token-soft">
        <CardHeader>
          <CardTitle className="text-base">New sign-ups · last 7 days</CardTitle>
        </CardHeader>
        <CardContent>
          {hasTrend ? (
            <div
              className="h-64 w-full"
              role="img"
              aria-label={`Daily sign-ups: ${registrationTrend.map((day) => `${day.day}: ${day.count}`).join(", ")}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={registrationTrend}
                  margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.day ?? ""} />
                  <Bar
                    dataKey="count"
                    name="Sign-ups"
                    fill="var(--institution-accent)"
                    maxBarSize={46}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="grid h-64 place-items-center text-sm text-muted-foreground">
              No sign-ups in the last 7 days.
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="border border-border bg-card shadow-token-soft">
        <CardHeader>
          <CardTitle className="text-base">Registration to check-in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="border bg-muted/30 p-4">
              <p className="text-3xl font-black tabular-nums">
                {metrics.eventRegistrations.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Registrations</p>
            </div>
            <div className="border bg-muted/30 p-4">
              <p className="text-3xl font-black tabular-nums">
                {registrationFlow.checkedIn.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Checked in</p>
            </div>
          </div>
          <div>
            <div className="mb-2 flex justify-between gap-3 text-sm">
              <span className="font-semibold">Check-in rate</span>
              <span className="tabular-nums">{checkInRate}%</span>
            </div>
            <div
              className="h-3 bg-muted"
              role="progressbar"
              aria-label="Check-in rate"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={checkInRate}
            >
              <div
                className="h-full bg-primary transition-[width] duration-300"
                style={{ width: `${checkInRate}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {registrationFlow.waitingList.toLocaleString()} waitlisted ·{" "}
            {registrationFlow.cancelled.toLocaleString()} cancelled
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

export function CommandCenterDashboard() {
  const qc = useQueryClient();
  const [programOpen, setProgramOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["command-center-dashboard"],
    queryFn: fetchCommandCenterDashboard,
    refetchInterval: 60_000,
  });

  function refreshDashboard() {
    void refetch();
    qc.invalidateQueries({ queryKey: ["command-center-counts"] });
  }

  async function importStarterContent() {
    const confirmed = window.confirm(
      "Synchronize the official CISC starter set: 9 programs, 5 events, 5 news articles, 5 markets, 5 partners, 3 podcasts, and 4 2FAS opportunities? Existing matching records will be updated.",
    );
    if (!confirmed) return;

    setIsImporting(true);
    try {
      const result = await importStarterContentServerFn();
      const total = Object.values(result).reduce((sum, count) => sum + count, 0);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["command-center-dashboard"] }),
        qc.invalidateQueries({ queryKey: ["programs"] }),
        qc.invalidateQueries({ queryKey: ["events"] }),
        qc.invalidateQueries({ queryKey: ["news"] }),
        qc.invalidateQueries({ queryKey: ["markets"] }),
        qc.invalidateQueries({ queryKey: ["partners"] }),
        qc.invalidateQueries({ queryKey: ["podcasts"] }),
        qc.invalidateQueries({ queryKey: ["internships"] }),
        qc.invalidateQueries({ queryKey: ["home-page"] }),
      ]);
      toast.success(
        total > 0
          ? `Synchronized ${total} CISC starter records.`
          : "CISC starter content is already synchronized.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Starter content import failed.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-2xl grad-crimson p-6 text-primary-foreground shadow-token-crimson sm:p-8">
        <div className="relative z-10">
          <span className="gold-bar mb-4" />
          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            {COMMAND_CENTER_TITLE}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
            {COMMAND_CENTER_SUBTITLE}
          </p>
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
            <Button
              size="sm"
              variant="secondary"
              className="min-h-[44px] bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={importStarterContent}
              disabled={isImporting}
            >
              <Sparkles className={`mr-1.5 h-4 w-4 ${isImporting ? "animate-pulse" : ""}`} />
              {isImporting ? "Importing…" : "Import CISC Starter Content"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/15 text-primary-foreground hover:bg-white/25"
              asChild
            >
              <Link to="/admin/internships">
                <GraduationCap className="mr-1.5 h-4 w-4" />
                Internship Applications
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

      {data && !isError && <RegistrationInsights data={data} />}

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
              <p className="py-6 text-center text-sm text-muted-foreground">
                Activity unavailable.
              </p>
            )}
            {!isLoading && !isError && (data?.recentActivity.length ?? 0) === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No recent activity yet.
              </p>
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
              <p className="py-6 text-center text-sm text-muted-foreground">
                Review queue unavailable.
              </p>
            )}
            {!isLoading && !isError && (data?.pendingReview.length ?? 0) === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing needs review right now.
              </p>
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
