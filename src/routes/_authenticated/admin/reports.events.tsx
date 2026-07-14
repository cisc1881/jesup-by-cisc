import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CommandCenterContentShell, CommandCenterPageHeader } from "@/modules/admin";
import { EventReportPreviewPanel } from "@/components/admin/event-report-preview";
import { LoadingState, QueryErrorState } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  buildEventReportPreview,
  buildParticipantReportRows,
  downloadAllReportExports,
  downloadReportCsv,
  duplicateReportSnapshot,
  EMPTY_NARRATIVE_FIELDS,
  exportEventAttendanceCsvForEvents,
  exportEventDemographicAggregatesCsv,
  exportEventEvaluationCsv,
  exportEventGalleryListCsv,
  exportEventParticipantsCsv,
  exportEventSummaryCsv,
  fetchReportFilterOptions,
  finalizeReportSnapshot,
  getReportSnapshot,
  listReportDrafts,
  printEventReport,
  reopenReportDraft,
  saveReportDraft,
  type ReportFilters,
  type ReportNarrativeFields,
} from "@/lib/event-reporting";
import {
  reportDraftsQueryKey,
  reportFiltersQueryKey,
  reportSnapshotQueryKey,
} from "@/lib/query-config";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";
import { buildImpactReportContext } from "@/modules/ai/impact-report-context";
import { generateImpactReportServerFn } from "@/modules/ai/impact-report-server-fn";

export const Route = createFileRoute("/_authenticated/admin/reports/events")({
  component: AdminEventReportsPage,
});

const DEFAULT_FILTERS: ReportFilters = { eventIds: [] };

function AdminEventReportsPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS);
  const [narrative, setNarrative] = useState<ReportNarrativeFields>(EMPTY_NARRATIVE_FIELDS);
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
  const [multiSelect, setMultiSelect] = useState<string[]>([]);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);

  const { data: options } = useQuery({
    queryKey: ["report-filter-options"],
    queryFn: fetchReportFilterOptions,
  });

  const { data: drafts = [], isError: draftsError } = useQuery({
    queryKey: reportDraftsQueryKey(),
    queryFn: listReportDrafts,
    retry: false,
  });

  const effectiveEventIds = useMemo(() => {
    if (filters.eventIds.length > 0) return filters.eventIds;
    if (multiSelect.length > 0) return multiSelect;
    return [];
  }, [filters.eventIds, multiSelect]);

  const queryFilters = useMemo(
    () => ({ ...filters, eventIds: effectiveEventIds }),
    [filters, effectiveEventIds],
  );

  const { data: activeSnapshot } = useQuery({
    queryKey: reportSnapshotQueryKey(activeSnapshotId ?? ""),
    queryFn: () => getReportSnapshot(activeSnapshotId!),
    enabled: !!activeSnapshotId,
    retry: false,
  });

  const {
    data: liveReport,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: reportFiltersQueryKey(queryFilters),
    queryFn: () => buildEventReportPreview(queryFilters, narrative, activeSnapshot ?? undefined),
    enabled:
      (effectiveEventIds.length > 0 || !!filters.dateFrom || !!filters.programId) &&
      !(activeSnapshot?.status === "final" && activeSnapshot.metricsSnapshot),
  });

  const report =
    activeSnapshot?.status === "final" && activeSnapshot.metricsSnapshot
      ? {
          ...activeSnapshot.metricsSnapshot,
          narrativeFields: {
            ...EMPTY_NARRATIVE_FIELDS,
            ...activeSnapshot.narrativeFields,
            ...narrative,
          },
          snapshotId: activeSnapshot.id,
          snapshotStatus: activeSnapshot.status,
          isFrozenSnapshot: true,
        }
      : liveReport;

  const duplicateMutation = useMutation({
    mutationFn: () => {
      if (!activeSnapshotId) throw new Error("Select a saved report first.");
      return duplicateReportSnapshot(activeSnapshotId);
    },
    onSuccess: (snapshot) => {
      setActiveSnapshotId(snapshot.id);
      void qc.invalidateQueries({ queryKey: reportDraftsQueryKey() });
      toast.success("Report duplicated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not duplicate"),
  });

  const reopenMutation = useMutation({
    mutationFn: () => {
      if (!activeSnapshotId) throw new Error("Select a saved report first.");
      return reopenReportDraft(activeSnapshotId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reportDraftsQueryKey() });
      void qc.invalidateQueries({ queryKey: reportSnapshotQueryKey(activeSnapshotId!) });
      void refetch();
      toast.success("Report reopened as draft");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not reopen"),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      saveReportDraft({
        id: activeSnapshotId ?? undefined,
        title: narrative.reportTitle || "Event Report",
        filters: queryFilters,
        narrativeFields: narrative,
        eventIds: report?.eventIds ?? effectiveEventIds,
      }),
    onSuccess: (snapshot) => {
      setActiveSnapshotId(snapshot.id);
      void qc.invalidateQueries({ queryKey: reportDraftsQueryKey() });
      toast.success("Report draft saved");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save draft"),
  });

  const finalizeMutation = useMutation({
    mutationFn: () => {
      if (!activeSnapshotId) throw new Error("Save a draft before finalizing.");
      return finalizeReportSnapshot(activeSnapshotId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reportDraftsQueryKey() });
      void refetch();
      toast.success("Report finalized");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not finalize"),
  });

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setMultiSelect([]);
    setNarrative(EMPTY_NARRATIVE_FIELDS);
    setActiveSnapshotId(null);
  }

  function loadDraft(id: string) {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;
    setActiveSnapshotId(draft.id);
    setFilters(draft.filters);
    setMultiSelect(draft.eventIds);
    setNarrative(draft.narrativeFields);
    toast.success("Draft loaded");
  }

  async function generateNarrative() {
    if (!report || report.isFrozenSnapshot) return;
    setIsGeneratingNarrative(true);
    try {
      const generated = await generateImpactReportServerFn({
        data: { metricsContext: buildImpactReportContext(report) },
      });
      setNarrative((current) => ({ ...current, ...generated }));
      toast.success("AI narrative added for review. Save the draft when ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate report narrative");
    } finally {
      setIsGeneratingNarrative(false);
    }
  }

  const attendanceChartData = report
    ? [
        { status: "Registered", count: report.attendance.registrations },
        { status: "Checked in", count: report.attendance.checkedIn },
        { status: "Attended", count: report.attendance.attended },
        { status: "Virtual", count: report.attendance.virtual },
        { status: "Walk-ins", count: report.attendance.walkIns },
        { status: "No-shows", count: report.attendance.noShows },
      ]
    : [];

  return (
    <CommandCenterContentShell>
      <div className="no-print mb-4">
        <Link
          to="/admin/reports"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </Link>
      </div>

      <CommandCenterPageHeader
        title="Event Reports"
        description="Attendance, evaluation, demographic, and gallery reporting for Cooperative Extension events."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="no-print space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Single event</Label>
                <Select
                  value={filters.eventIds[0] ?? "none"}
                  onValueChange={(v) => {
                    setFilters((f) => ({ ...f, eventIds: v === "none" ? [] : [v] }));
                    setMultiSelect([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(options?.events ?? []).map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Additional events (multi-event)</Label>
                <div className="max-h-32 space-y-1 overflow-y-auto rounded border p-2">
                  {(options?.events ?? []).map((e) => (
                    <label key={e.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={multiSelect.includes(e.id)}
                        onChange={(ev) => {
                          setMultiSelect((prev) =>
                            ev.target.checked ? [...prev, e.id] : prev.filter((id) => id !== e.id),
                          );
                          setFilters((f) => ({ ...f, eventIds: [] }));
                        }}
                      />
                      <span className="line-clamp-1">{e.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <Label>Date from</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom?.slice(0, 10) ?? ""}
                    onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Date to</Label>
                  <Input
                    type="date"
                    value={filters.dateTo?.slice(0, 10) ?? ""}
                    onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Program</Label>
                <Select
                  value={filters.programId ?? "all"}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, programId: v === "all" ? undefined : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All programs</SelectItem>
                    {(options?.programs ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={filters.categoryId ?? "all"}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, categoryId: v === "all" ? undefined : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {(options?.categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>County</Label>
                <Select
                  value={filters.county ?? "all"}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, county: v === "all" ? undefined : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All counties</SelectItem>
                    {(options?.counties ?? []).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Report narrative</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(
                [
                  ["reportTitle", "Report title"],
                  ["eventPurpose", "Event purpose"],
                  ["programGoals", "Program goals"],
                  ["outcomesImpactNotes", "Outcomes and impact"],
                  ["recommendations", "Recommendations"],
                  ["followUpActions", "Follow-up actions"],
                  ["selectedParticipantQuotes", "Selected quotes"],
                  ["preparedBy", "Prepared by"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <Label htmlFor={`narrative-${key}`}>{label}</Label>
                  {key.includes("Notes") ||
                  key.includes("Goals") ||
                  key.includes("Quotes") ||
                  key.includes("Purpose") ||
                  key.includes("recommendations") ||
                  key.includes("Follow") ? (
                    <Textarea
                      id={`narrative-${key}`}
                      rows={2}
                      value={narrative[key]}
                      onChange={(e) => setNarrative((n) => ({ ...n, [key]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      id={`narrative-${key}`}
                      value={narrative[key]}
                      onChange={(e) => setNarrative((n) => ({ ...n, [key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
              <div>
                <Label htmlFor="narrative-reportDate">Report date</Label>
                <Input
                  id="narrative-reportDate"
                  type="date"
                  value={narrative.reportDate}
                  onChange={(e) => setNarrative((n) => ({ ...n, reportDate: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {draftsError && (
            <p className="text-sm text-muted-foreground">
              Saved report drafts are unavailable. Confirm the event report snapshots migration is
              applied.
            </p>
          )}
          {drafts.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Saved drafts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {drafts.map((draft) => (
                  <button
                    key={draft.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded border px-3 py-2 text-left text-sm hover:bg-secondary"
                    onClick={() => loadDraft(draft.id)}
                  >
                    <span className="line-clamp-1">{draft.title}</span>
                    <Badge variant={draft.status === "final" ? "default" : "secondary"}>
                      {draft.status}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>

        <div className="space-y-6">
          <div className="no-print flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void generateNarrative()}
              disabled={!report || report.isFrozenSnapshot || isGeneratingNarrative}
            >
              {isGeneratingNarrative ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Draft narrative with AI
            </Button>
            <Button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !report}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save draft
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => finalizeMutation.mutate()}
              disabled={finalizeMutation.isPending || !activeSnapshotId}
            >
              Finalize
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => duplicateMutation.mutate()}
              disabled={duplicateMutation.isPending || !activeSnapshotId}
            >
              Duplicate
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reopenMutation.mutate()}
              disabled={
                reopenMutation.isPending || !activeSnapshotId || activeSnapshot?.status !== "final"
              }
            >
              Reopen draft
            </Button>
            <Button type="button" variant="outline" onClick={printEventReport}>
              <Printer className="h-4 w-4" />
              Print report
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" disabled={!report}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    report && downloadReportCsv("event-summary", exportEventSummaryCsv(report))
                  }
                >
                  Summary CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    if (!report) return;
                    const rows = await buildParticipantReportRows(report.eventIds);
                    downloadReportCsv("event-participants", exportEventParticipantsCsv(rows));
                  }}
                >
                  Participants CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    if (!report) return;
                    downloadReportCsv(
                      "event-attendance",
                      await exportEventAttendanceCsvForEvents(report.eventIds),
                    );
                  }}
                >
                  Attendance CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    if (!report) return;
                    downloadReportCsv(
                      "event-evaluations",
                      await exportEventEvaluationCsv(report.eventIds),
                    );
                  }}
                >
                  Evaluation CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    report &&
                    downloadReportCsv(
                      "event-demographics",
                      exportEventDemographicAggregatesCsv(report.demographics.rows),
                    )
                  }
                >
                  Demographic aggregates CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    if (!report) return;
                    downloadReportCsv(
                      "event-gallery",
                      await exportEventGalleryListCsv(report.eventIds),
                    );
                  }}
                >
                  Gallery CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => report && downloadAllReportExports(report)}>
                  Export all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading && <LoadingState label="Building report…" />}
          {isError && <QueryErrorState title="Couldn't build report" onRetry={() => refetch()} />}

          {!isLoading && !isError && !report && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Select an event, multiple events, or apply date/program filters to generate a
                  report.
                </p>
              </CardContent>
            </Card>
          )}

          {report && (
            <>
              <div className="no-print grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Registrations</div>
                    <div className="text-2xl font-bold">{report.attendance.registrations}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Attendance rate</div>
                    <div className="text-2xl font-bold">{report.attendance.attendanceRate}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Evaluations</div>
                    <div className="text-2xl font-bold">{report.evaluation.completedResponses}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Gallery images</div>
                    <div className="text-2xl font-bold">{report.gallery.approvedImages}</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="no-print">
                <CardHeader>
                  <CardTitle className="text-base">Attendance status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{ count: { label: "Participants", color: "hsl(var(--primary))" } }}
                    className="h-56 w-full"
                  >
                    <BarChart data={attendanceChartData} accessibilityLayer>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="status" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                  <table className="mt-4 w-full text-sm sr-only-focusable:not-sr-only">
                    <caption className="sr-only">Attendance status table</caption>
                    <tbody>
                      {attendanceChartData.map((row) => (
                        <tr key={row.status}>
                          <td>{row.status}</td>
                          <td>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <EventReportPreviewPanel report={{ ...report, narrativeFields: narrative }} />
            </>
          )}
        </div>
      </div>
    </CommandCenterContentShell>
  );
}
