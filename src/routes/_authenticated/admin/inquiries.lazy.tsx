import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { InquiryDetailDrawer } from "@/components/admin/inquiry-detail-drawer";
import { EmptyState, LoadingState, QueryErrorState } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";
import { fmtDateTime } from "@/lib/format";
import { fetchPrograms } from "@/lib/programs";
import { INSTITUTION_TYPE_LABELS, type InstitutionType } from "@/lib/institutions";
import {
  formatInquiryReference,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUSES,
  INQUIRY_TYPE_LABELS,
  INQUIRY_TYPES,
  INQUIRY_US_STATES,
  listAdminInquiries,
  listAdminStaff,
  matchesInquirySearch,
  type Inquiry,
  type InquiryFilters,
  type InquiryStatus,
  type InquiryType,
} from "@/lib/inquiries";
import { adminInquiriesQueryKey } from "@/lib/query-config";
import { Eye, Inbox } from "lucide-react";

export const Route = createLazyFileRoute("/_authenticated/admin/inquiries")({
  component: AdminInquiries,
});

function statusVariant(status: InquiryStatus): "default" | "secondary" | "outline" | "destructive" {
  if (status === "new") return "default";
  if (status === "closed" || status === "resolved") return "secondary";
  return "outline";
}

function AdminInquiries() {
  const navigate = useNavigate({ from: "/admin/inquiries" });
  const search = Route.useSearch();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<InquiryFilters>({});
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: inquiries = [], isLoading, isError, refetch } = useQuery({
    queryKey: adminInquiriesQueryKey(filters),
    queryFn: () => listAdminInquiries(filters),
  });

  const { data: programs = [] } = useQuery({
    queryKey: ["programs", "admin-inquiries"],
    queryFn: () => fetchPrograms({ activeOnly: false }),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: listAdminStaff,
  });

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(INQUIRY_STATUSES.map((s) => [s, 0])) as Record<InquiryStatus, number>;
    for (const inquiry of inquiries) counts[inquiry.status] += 1;
    return counts;
  }, [inquiries]);

  const rows = useMemo(
    () => inquiries.filter((inquiry) => matchesInquirySearch(inquiry, q)),
    [inquiries, q],
  );

  useEffect(() => {
    if (!search.id || inquiries.length === 0) return;
    const match = inquiries.find((inquiry) => inquiry.id === search.id);
    if (match) {
      setSelected(match);
      setDrawerOpen(true);
    }
  }, [search.id, inquiries]);

  function openInquiry(inquiry: Inquiry) {
    setSelected(inquiry);
    setDrawerOpen(true);
    navigate({ search: { id: inquiry.id } });
  }

  function closeDrawer(open: boolean) {
    setDrawerOpen(open);
    if (!open) {
      setSelected(null);
      navigate({ search: {} });
    }
  }

  function toggleStatusFilter(status: InquiryStatus) {
    setFilters((prev) => ({
      ...prev,
      status: prev.status === status ? undefined : status,
    }));
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Inquiries"
        description="Review public join/connect submissions, assign staff, and track follow-up."
        searchValue={q}
        onSearchChange={setQ}
        onExport={() =>
          downloadCsv("inquiries", rows, [
            { header: "Reference", get: (r) => formatInquiryReference(r.id) },
            { header: "Submitted", get: (r) => r.submittedAt },
            { header: "Type", get: (r) => INQUIRY_TYPE_LABELS[r.inquiryType] },
            { header: "Status", get: (r) => INQUIRY_STATUS_LABELS[r.status] },
            { header: "First name", get: (r) => r.firstName },
            { header: "Last name", get: (r) => r.lastName },
            { header: "Email", get: (r) => r.email },
            { header: "Phone", get: (r) => r.phone },
            { header: "Program", get: (r) => r.programName },
            { header: "Institution", get: (r) => r.institutionName ?? r.organizationOrSchool },
            { header: "Institution type", get: (r) => (r.institutionType ? INSTITUTION_TYPE_LABELS[r.institutionType] : "") },
            { header: "City", get: (r) => r.city },
            { header: "County", get: (r) => r.county },
            { header: "State", get: (r) => r.state },
            { header: "Newsletter opt-in", get: (r) => (r.newsletterOptIn ? "yes" : "no") },
          ])
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {INQUIRY_STATUSES.filter((status) => statusCounts[status] > 0).map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={filters.status === status ? "default" : "outline"}
            onClick={() => toggleStatusFilter(status)}
          >
            {INQUIRY_STATUS_LABELS[status]}
            <Badge variant="secondary" className="ml-2">
              {statusCounts[status]}
            </Badge>
          </Button>
        ))}
      </div>

      <Card className="mb-4">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="filter-type">Inquiry type</Label>
            <Select
              value={filters.inquiryType ?? "all"}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, inquiryType: v === "all" ? undefined : (v as InquiryType) }))}
            >
              <SelectTrigger id="filter-type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {INQUIRY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {INQUIRY_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-program">Program</Label>
            <Select
              value={filters.programId ?? "all"}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, programId: v === "all" ? undefined : v }))}
            >
              <SelectTrigger id="filter-program">
                <SelectValue placeholder="All programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programs</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-state">State</Label>
            <Select
              value={filters.state ?? "all"}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, state: v === "all" ? undefined : v }))}
            >
              <SelectTrigger id="filter-state">
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                {INQUIRY_US_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-institution-type">Institution type</Label>
            <Select
              value={filters.institutionType ?? "all"}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  institutionType: v === "all" ? undefined : (v as InstitutionType),
                }))
              }
            >
              <SelectTrigger id="filter-institution-type">
                <SelectValue placeholder="All institution types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All institution types</SelectItem>
                {(Object.keys(INSTITUTION_TYPE_LABELS) as InstitutionType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {INSTITUTION_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading && <LoadingState label="Loading inquiries…" className="p-6" />}
          {isError && (
            <QueryErrorState
              title="Couldn't load inquiries"
              onRetry={() => refetch()}
              className="m-6"
            />
          )}

          {!isLoading && !isError && (
            <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8">
                      <EmptyState
                        icon={Inbox}
                        title="No inquiries match your filters"
                        description="Try clearing filters or adjusting your search."
                      />
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell className="font-mono text-xs">{formatInquiryReference(inquiry.id)}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {inquiry.firstName} {inquiry.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{inquiry.email}</div>
                    </TableCell>
                    <TableCell className="text-sm">{INQUIRY_TYPE_LABELS[inquiry.inquiryType]}</TableCell>
                    <TableCell className="text-sm">{inquiry.programName ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(inquiry.status)}>{INQUIRY_STATUS_LABELS[inquiry.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDateTime(inquiry.submittedAt)}</TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10"
                        onClick={() => openInquiry(inquiry)}
                        aria-label={`Review inquiry from ${inquiry.firstName} ${inquiry.lastName}`}
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
            {rows.length === 0 && (
              <div className="p-6">
                <EmptyState
                  icon={Inbox}
                  title="No inquiries match your filters"
                  description="Try clearing filters or adjusting your search."
                />
              </div>
            )}
            {rows.map((inquiry) => (
              <div key={inquiry.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {inquiry.firstName} {inquiry.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">{inquiry.email}</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                      Ref {formatInquiryReference(inquiry.id)}
                    </div>
                  </div>
                  <Badge variant={statusVariant(inquiry.status)}>{INQUIRY_STATUS_LABELS[inquiry.status]}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {INQUIRY_TYPE_LABELS[inquiry.inquiryType]}
                  {inquiry.programName ? ` · ${inquiry.programName}` : ""}
                </div>
                <div className="text-xs text-muted-foreground">{fmtDateTime(inquiry.submittedAt)}</div>
                <Button type="button" size="sm" variant="outline" onClick={() => openInquiry(inquiry)}>
                  Review inquiry
                </Button>
              </div>
            ))}
          </div>
            </>
          )}
        </CardContent>
      </Card>

      <InquiryDetailDrawer inquiry={selected} open={drawerOpen} onOpenChange={closeDrawer} staff={staff} />
    </AdminShell>
  );
}
