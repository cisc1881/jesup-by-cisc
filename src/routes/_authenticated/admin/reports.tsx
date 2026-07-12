import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CommandCenterContentShell, CommandCenterPageHeader } from "@/modules/admin";
import { fetchAnalyticsSummary } from "@/modules/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutGrid,
  Calendar,
  MapPin,
  BookOpen,
  Mic,
  Building2,
  Users,
  Package,
  Image,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reports")({ component: AdminReports });

const METRICS = [
  { key: "programs" as const, label: "Active Programs", icon: LayoutGrid },
  { key: "events" as const, label: "Active Events", icon: Calendar },
  { key: "markets" as const, label: "Active Markets", icon: MapPin },
  { key: "publications" as const, label: "Publications", icon: BookOpen },
  { key: "podcasts" as const, label: "Podcast Episodes", icon: Mic },
  { key: "partners" as const, label: "Partners", icon: Building2 },
  { key: "registrations" as const, label: "Event Registrations", icon: Calendar },
  { key: "pendingApprovals" as const, label: "Pending Approvals", icon: Package },
  { key: "users" as const, label: "Users", icon: Users },
  { key: "media" as const, label: "Media Assets", icon: Image },
];

function AdminReports() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId === "/_authenticated/admin/reports/events");
  if (isChild) return <Outlet />;

  const { data: summary, isLoading } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: fetchAnalyticsSummary,
  });

  return (
    <CommandCenterContentShell>
      <CommandCenterPageHeader
        title="Reports"
        description="Platform-wide metrics and reporting across all JESUP modules."
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/reports/events">Event Reports</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {METRICS.map((metric) => (
          <Card key={metric.key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                <span>{metric.label}</span>
                <metric.icon className="h-4 w-4 text-accent" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-serif text-3xl font-bold text-primary">
                {isLoading ? "—" : (summary?.[metric.key] ?? "—")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="font-semibold text-foreground">Event reporting</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Build printable event reports with attendance, evaluation, demographic aggregates, gallery documentation, and CSV exports.
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <Link to="/admin/reports/events">Open Event Reports</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-6">
          <h2 className="font-semibold text-foreground">Reporting roadmap</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Future reports will include engagement trends, content performance, geographic reach,
            registration funnels, and leadership insights for Cooperative Extension.
          </p>
        </CardContent>
      </Card>
    </CommandCenterContentShell>
  );
}
