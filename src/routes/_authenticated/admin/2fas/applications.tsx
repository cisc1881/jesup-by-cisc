import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { TwofasApplicationDetailDialog } from "@/components/admin/twofas-application-detail-dialog";
import {
  TwofasApplicationFiltersBar,
  type TwofasApplicationFilters,
} from "@/components/admin/twofas-application-filters";
import { TwofasApplicationStatusBadge } from "@/components/admin/twofas-application-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";
import { fmtDate } from "@/lib/format";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUSES,
  TWOFAS_TRACK_LABELS,
  list2FASCohorts,
  listAdmin2FASApplications,
  type ApplicationStatus,
  type TwofasApplication,
} from "@/lib/twofas";
import { useAuth } from "@/hooks/use-auth";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/2fas/applications")({
  component: Admin2FASApplications,
});

function matchesSearch(app: TwofasApplication, q: string) {
  const needle = q.toLowerCase();
  return (
    (app.applicantName ?? "").toLowerCase().includes(needle) ||
    (app.applicantEmail ?? "").toLowerCase().includes(needle) ||
    (app.internship?.title ?? "").toLowerCase().includes(needle) ||
    (app.schoolName ?? "").toLowerCase().includes(needle) ||
    (app.major ?? "").toLowerCase().includes(needle)
  );
}

function Admin2FASApplications() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<TwofasApplicationFilters>({});
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: cohorts = [] } = useQuery({
    queryKey: ["admin-2fas-cohorts"],
    queryFn: () => list2FASCohorts({ activeOnly: false }),
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["admin-2fas-applications", filters],
    queryFn: () => listAdmin2FASApplications(filters),
  });

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0])) as Record<ApplicationStatus, number>;
    for (const app of applications) counts[app.status] += 1;
    return counts;
  }, [applications]);

  const rows = useMemo(
    () => applications.filter((app) => !q || matchesSearch(app, q)),
    [applications, q],
  );

  function toggleStatusFilter(status: ApplicationStatus) {
    setFilters((prev) => ({
      ...prev,
      status: prev.status === status ? undefined : status,
    }));
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="2FAS Applications"
        description="Review, filter, and advance Future Farmers and Agricultural Specialists applications."
        searchValue={q}
        onSearchChange={setQ}
        onExport={() =>
          downloadCsv("2fas-applications", rows, [
            { header: "Applicant", get: (r) => r.applicantName },
            { header: "Email", get: (r) => r.applicantEmail },
            { header: "Opportunity", get: (r) => r.internship?.title },
            { header: "Track", get: (r) => (r.track ? TWOFAS_TRACK_LABELS[r.track] : "") },
            { header: "Cohort", get: (r) => r.cohort?.name },
            { header: "Status", get: (r) => APPLICATION_STATUS_LABELS[r.status] },
            { header: "Submitted", get: (r) => r.submittedAt ?? r.createdAt },
          ])
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {APPLICATION_STATUSES.filter((status) => statusCounts[status] > 0).map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={filters.status === status ? "default" : "outline"}
            onClick={() => toggleStatusFilter(status)}
          >
            {APPLICATION_STATUS_LABELS[status]}
            <Badge variant="secondary" className="ml-2">
              {statusCounts[status]}
            </Badge>
          </Button>
        ))}
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <TwofasApplicationFiltersBar filters={filters} cohorts={cohorts} onChange={setFilters} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading && <p className="p-6 text-sm text-muted-foreground">Loading applications…</p>}

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Cohort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No applications match your filters.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="font-medium">{app.applicantName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{app.applicantEmail}</div>
                    </TableCell>
                    <TableCell className="text-sm">{app.internship?.title ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {app.track ? TWOFAS_TRACK_LABELS[app.track] : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{app.cohort?.name ?? "—"}</TableCell>
                    <TableCell>
                      <TwofasApplicationStatusBadge status={app.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDate(app.submittedAt ?? app.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10"
                        onClick={() => setDetailId(app.id)}
                        aria-label={`Review application from ${app.applicantName ?? "applicant"}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y md:hidden">
            {!isLoading && rows.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No applications match your filters.</p>
            )}
            {rows.map((app) => (
              <div key={app.id} className="space-y-3 p-4">
                <div>
                  <div className="font-medium">{app.applicantName ?? "—"}</div>
                  <div className="text-sm text-muted-foreground">{app.applicantEmail}</div>
                </div>
                <div className="text-sm">
                  <div>{app.internship?.title ?? "—"}</div>
                  <div className="text-muted-foreground">
                    {app.track ? TWOFAS_TRACK_LABELS[app.track] : "—"}
                    {app.cohort?.name ? ` · ${app.cohort.name}` : ""}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <TwofasApplicationStatusBadge status={app.status} />
                  <span className="text-xs text-muted-foreground">
                    Submitted {fmtDate(app.submittedAt ?? app.createdAt)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px] w-full"
                  onClick={() => setDetailId(app.id)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Review application
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <TwofasApplicationDetailDialog
        applicationId={detailId}
        adminUserId={user?.id ?? ""}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </AdminShell>
  );
}
