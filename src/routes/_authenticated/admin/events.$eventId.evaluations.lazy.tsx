import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { DemographicAggregateCards } from "@/components/demographics/demographic-aggregate-cards";
import { EmptyState, LoadingState, QueryErrorState } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { downloadCsv } from "@/lib/csv";
import { fmtDateTime } from "@/lib/format";
import { fetchEventAttendanceHeader } from "@/lib/attendance";
import {
  EVALUATION_RESPONSE_EXPORT_COLUMNS,
  EVALUATION_RESPONSE_MODE_LABELS,
  getEvaluationSummary,
  listAdminEvaluationResponses,
} from "@/lib/evaluations";
import {
  adminEvaluationResponsesQueryKey,
  adminEvaluationSummaryQueryKey,
} from "@/lib/query-config";
import { ArrowLeft } from "lucide-react";

export const Route = createLazyFileRoute("/_authenticated/admin/events/$eventId/evaluations")({
  component: AdminEventEvaluationsPage,
});

function AdminEventEvaluationsPage() {
  const { eventId } = Route.useParams();
  const [q, setQ] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "identified" | "anonymous">("all");

  const { data: header } = useQuery({
    queryKey: ["event-attendance-header", eventId],
    queryFn: () => fetchEventAttendanceHeader(eventId),
  });

  const {
    data: rows = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: adminEvaluationResponsesQueryKey(eventId),
    queryFn: () => listAdminEvaluationResponses(eventId),
  });

  const { data: summary } = useQuery({
    queryKey: adminEvaluationSummaryQueryKey(eventId),
    queryFn: () => getEvaluationSummary(eventId),
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (modeFilter !== "all" && row.responseMode !== modeFilter) return false;
      if (!needle) return true;
      return (
        row.questionPrompt.toLowerCase().includes(needle) ||
        row.answerText.toLowerCase().includes(needle) ||
        (row.participantName ?? "").toLowerCase().includes(needle) ||
        (row.participantEmail ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q, modeFilter]);

  const openTextRows = useMemo(
    () =>
      filtered.filter(
        (row) =>
          row.questionType === "long_text" ||
          row.questionType === "short_text",
      ),
    [filtered],
  );

  return (
    <AdminShell>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link to="/admin/events">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        {header && (
          <div>
            <h2 className="font-serif text-xl font-semibold text-primary">{header.title}</h2>
            <p className="text-sm text-muted-foreground">{fmtDateTime(header.startsAt)}</p>
          </div>
        )}
      </div>

      <AdminPageHeader
        title="Evaluation responses"
        description="Review native evaluation submissions and export response data."
        searchValue={q}
        onSearchChange={setQ}
        onExport={() => downloadCsv(`event-evaluations-${eventId}`, filtered, EVALUATION_RESPONSE_EXPORT_COLUMNS)}
      />

      {summary && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Total responses", value: summary.totalResponses },
            { label: "Completed", value: summary.completedResponses },
            { label: "Response rate", value: `${summary.responseRate}%` },
            { label: "Avg rating", value: summary.averageRating ?? "—" },
            { label: "Identified", value: summary.identifiedCount },
            { label: "Anonymous", value: summary.anonymousCount },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DemographicAggregateCards eventId={eventId} />

      {summary && summary.questionSummaries.length > 0 && (
        <Card className="mb-4">
          <CardContent className="space-y-4 pt-6">
            <h3 className="font-medium">Question summaries</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {summary.questionSummaries.map((item) => (
                <div key={item.questionId} className="rounded-lg border p-3">
                  <div className="font-medium">{item.prompt}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.responseCount} responses
                    {item.averageRating != null ? ` · Avg ${item.averageRating}` : ""}
                  </div>
                  {Object.keys(item.choiceCounts).length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {Object.entries(item.choiceCounts).map(([choice, count]) => (
                        <li key={choice}>
                          {choice}: {count}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "identified", "anonymous"] as const).map((mode) => (
          <Button
            key={mode}
            size="sm"
            variant={modeFilter === mode ? "default" : "outline"}
            onClick={() => setModeFilter(mode)}
          >
            {mode === "all" ? "All" : EVALUATION_RESPONSE_MODE_LABELS[mode]}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && <LoadingState label="Loading responses…" className="p-6" />}
          {isError && (
            <QueryErrorState message="Could not load evaluation responses." onRetry={() => void refetch()} className="p-6" />
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <EmptyState title="No responses" description="Evaluation responses will appear here." className="p-6" />
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Answer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row) => (
                      <TableRow key={`${row.responseId}-${row.questionId}`}>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.submittedAt ? fmtDateTime(row.submittedAt) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{EVALUATION_RESPONSE_MODE_LABELS[row.responseMode]}</Badge>
                        </TableCell>
                        <TableCell>
                          {row.responseMode === "identified" ? (
                            <div>
                              <div>{row.participantName ?? "—"}</div>
                              <div className="text-xs text-muted-foreground">{row.participantEmail}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Anonymous</span>
                          )}
                        </TableCell>
                        <TableCell>{row.questionPrompt}</TableCell>
                        <TableCell className="max-w-md whitespace-pre-wrap text-sm">{row.answerText}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="divide-y md:hidden">
                {filtered.map((row) => (
                  <div key={`${row.responseId}-${row.questionId}`} className="space-y-2 p-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{EVALUATION_RESPONSE_MODE_LABELS[row.responseMode]}</Badge>
                      {row.submittedAt && (
                        <span className="text-xs text-muted-foreground">{fmtDateTime(row.submittedAt)}</span>
                      )}
                    </div>
                    {row.responseMode === "identified" && (
                      <div className="text-sm">
                        <div className="font-medium">{row.participantName}</div>
                        <div className="text-muted-foreground">{row.participantEmail}</div>
                      </div>
                    )}
                    <div className="font-medium">{row.questionPrompt}</div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{row.answerText}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {openTextRows.length > 0 && (
        <Card className="mt-4">
          <CardContent className="space-y-3 pt-6">
            <h3 className="font-medium">Open-text responses</h3>
            {openTextRows.slice(0, 20).map((row) => (
              <div key={`${row.responseId}-${row.questionId}-open`} className="rounded-lg border p-3">
                <div className="text-sm font-medium">{row.questionPrompt}</div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{row.answerText}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </AdminShell>
  );
}
