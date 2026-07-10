import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { AttendanceImportDialog } from "@/components/admin/attendance-import-dialog";
import { WalkInFormDialog } from "@/components/admin/walk-in-form-dialog";
import { DemographicAggregateCards } from "@/components/demographics/demographic-aggregate-cards";
import { EmptyState, LoadingState, QueryErrorState } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import {
  ATTENDANCE_EXPORT_COLUMNS,
  ATTENDANCE_STATUS_LABELS,
  bulkUpdateAttendanceStatus,
  checkInByTicketCode,
  fetchEventAttendanceHeader,
  getAttendanceSummary,
  listEventAttendance,
  matchesAttendanceFilter,
  matchesAttendanceSearch,
  updateAttendanceNotes,
  updateAttendanceStatus,
  type AttendanceFilter,
  type AttendanceStatus,
  type EventAttendanceRow,
} from "@/lib/attendance";
import { downloadCsv } from "@/lib/csv";
import { fmtDateTime } from "@/lib/format";
import {
  adminEventAttendanceQueryKey,
  adminEventAttendanceSummaryQueryKey,
  adminEventWalkInsQueryKey,
} from "@/lib/query-config";
import { toast } from "sonner";
import {
  ArrowLeft,
  ClipboardCheck,
  Loader2,
  Upload,
  UserCheck,
  UserPlus,
} from "lucide-react";

export const Route = createLazyFileRoute("/_authenticated/admin/events/$eventId/attendance")({
  component: EventAttendancePage,
});

const FILTERS: { id: AttendanceFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "registered", label: "Registered" },
  { id: "checked_in", label: "Checked In" },
  { id: "attended", label: "Attended" },
  { id: "virtual", label: "Virtual" },
  { id: "walk_ins", label: "Walk-Ins" },
  { id: "no_show", label: "No-Shows" },
  { id: "cancelled", label: "Cancelled" },
];

const BULK_STATUSES: { status: AttendanceStatus; label: string; destructive?: boolean }[] = [
  { status: "checked_in", label: "Mark checked in" },
  { status: "attended", label: "Mark attended" },
  { status: "virtual", label: "Mark virtual" },
  { status: "no_show", label: "Mark no-show", destructive: true },
  { status: "cancelled", label: "Mark cancelled", destructive: true },
];

function statusVariant(status: AttendanceStatus): "default" | "secondary" | "outline" | "destructive" {
  if (status === "no_show") return "destructive";
  if (status === "cancelled") return "secondary";
  if (status === "checked_in" || status === "attended") return "default";
  return "outline";
}

function invalidateAttendanceQueries(qc: ReturnType<typeof useQueryClient>, eventId: string) {
  void qc.invalidateQueries({ queryKey: adminEventAttendanceQueryKey(eventId) });
  void qc.invalidateQueries({ queryKey: adminEventWalkInsQueryKey(eventId) });
  void qc.invalidateQueries({ queryKey: adminEventAttendanceSummaryQueryKey(eventId) });
  void qc.invalidateQueries({ queryKey: ["event-regs-admin", eventId] });
  void qc.invalidateQueries({ queryKey: ["event-analytics", eventId] });
  void qc.invalidateQueries({ queryKey: ["command-center-dashboard"] });
  void qc.invalidateQueries({ queryKey: ["command-center-counts"] });
}

function SummaryCards({ summary }: { summary: Awaited<ReturnType<typeof getAttendanceSummary>> }) {
  const items = [
    { label: "Registered", value: summary.totalRegistered },
    { label: "Checked in", value: summary.checkedIn },
    { label: "Attended", value: summary.attended },
    { label: "Virtual", value: summary.virtual },
    { label: "Walk-ins", value: summary.walkIns },
    { label: "No-shows", value: summary.noShows },
    { label: "Cancelled", value: summary.cancelled },
    { label: "Attendance rate", value: `${summary.attendanceRate}%` },
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AttendanceRowActions({
  row,
  eventId,
  adminUserId,
  onUpdated,
  onEditNote,
}: {
  row: EventAttendanceRow;
  eventId: string;
  adminUserId?: string | null;
  onUpdated: () => void;
  onEditNote: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function setStatus(status: AttendanceStatus) {
    setBusy(true);
    try {
      await updateAttendanceStatus({
        eventId,
        attendanceId: row.id,
        status,
        adminUserId,
        attendanceMethod: "manual",
        syncLegacyCheckin: status === "checked_in",
      });
      toast.success(`Marked ${ATTENDANCE_STATUS_LABELS[status].toLowerCase()}`);
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-1">
      {row.status === "registered" && (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void setStatus("checked_in")}>
          <UserCheck className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:ml-1">Check in</span>
        </Button>
      )}
      {row.status !== "attended" && (
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void setStatus("attended")}>
          Attended
        </Button>
      )}
      {row.status !== "virtual" && (
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void setStatus("virtual")}>
          Virtual
        </Button>
      )}
      {row.status !== "no_show" && (
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void setStatus("no_show")}>
          No-show
        </Button>
      )}
      {row.status !== "cancelled" && (
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void setStatus("cancelled")}>
          Cancelled
        </Button>
      )}
      <Button size="sm" variant="ghost" disabled={busy} onClick={onEditNote}>
        Note
      </Button>
    </div>
  );
}

function EventAttendancePage() {
  const { eventId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirmDialog();

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [ticketCode, setTicketCode] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [noteRow, setNoteRow] = useState<EventAttendanceRow | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data: header, isLoading: headerLoading } = useQuery({
    queryKey: ["event-attendance-header", eventId],
    queryFn: () => fetchEventAttendanceHeader(eventId),
  });

  const {
    data: rows = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: adminEventAttendanceQueryKey(eventId),
    queryFn: () => listEventAttendance(eventId),
  });

  const { data: summary } = useQuery({
    queryKey: adminEventAttendanceSummaryQueryKey(eventId),
    queryFn: () => getAttendanceSummary(eventId),
  });

  const filtered = useMemo(
    () => rows.filter((row) => matchesAttendanceFilter(row, filter) && matchesAttendanceSearch(row, q)),
    [rows, filter, q],
  );

  const allFilteredSelected = filtered.length > 0 && filtered.every((row) => selected.has(row.id));

  function refresh() {
    invalidateAttendanceQueries(qc, eventId);
  }

  function toggleRow(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(filtered.map((row) => row.id)));
  }

  async function handleTicketCheckIn() {
    if (!ticketCode.trim()) {
      toast.error("Enter a ticket code.");
      return;
    }
    setCheckingIn(true);
    try {
      await checkInByTicketCode(eventId, ticketCode, user?.id ?? null);
      toast.success("Checked in by ticket code");
      setTicketCode("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleBulkStatus(status: AttendanceStatus, destructive?: boolean) {
    const ids = [...selected];
    if (ids.length === 0) return;

    if (destructive) {
      const ok = await confirm({
        title: `Mark ${ids.length} as ${ATTENDANCE_STATUS_LABELS[status].toLowerCase()}?`,
        description: "This bulk update affects all selected participants.",
        confirmLabel: "Update selected",
        destructive: true,
      });
      if (!ok) return;
    }

    setBulkBusy(true);
    try {
      await bulkUpdateAttendanceStatus(eventId, ids, status, user?.id ?? null);
      toast.success(`Updated ${ids.length} participant(s)`);
      setSelected(new Set());
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  }

  async function saveNote() {
    if (!noteRow) return;
    setSavingNote(true);
    try {
      await updateAttendanceNotes(eventId, noteRow.id, noteText.trim() || null);
      toast.success("Note saved");
      setNoteRow(null);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save note");
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <AdminShell>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link to="/admin/events">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        {headerLoading && <LoadingState label="Loading event…" />}
        {header && (
          <div>
            <h2 className="font-serif text-xl font-semibold text-primary">{header.title}</h2>
            <p className="text-sm text-muted-foreground">
              {fmtDateTime(header.startsAt)}
              {header.location ? ` · ${header.location}` : ""}
            </p>
          </div>
        )}
      </div>

      <AdminPageHeader
        title="Event attendance"
        description="Manual check-in, walk-ins, and attendance status for this event."
        searchValue={q}
        onSearchChange={setQ}
        onExport={() =>
          downloadCsv(`event-attendance-${eventId}`, rows, ATTENDANCE_EXPORT_COLUMNS)
        }
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/events/$eventId/evaluations" params={{ eventId }}>
                Evaluation responses
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="md:hidden" onClick={() => setWalkInOpen(true)}>
              <UserPlus className="mr-1 h-4 w-4" />
              Add walk-in
            </Button>
            <Button variant="outline" size="sm" className="md:hidden" onClick={() => void handleTicketCheckIn()} disabled={checkingIn}>
              <ClipboardCheck className="mr-1 h-4 w-4" />
              Check in
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="mr-1 h-4 w-4" />
              Import CSV
            </Button>
            <Button size="sm" className="hidden md:inline-flex" onClick={() => setWalkInOpen(true)}>
              <UserPlus className="mr-1 h-4 w-4" />
              Add walk-in
            </Button>
          </>
        }
      />

      {summary && <SummaryCards summary={summary} />}

      <DemographicAggregateCards eventId={eventId} />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="ticket-code">Check in by ticket code</Label>
            <Input
              id="ticket-code"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
              placeholder="Enter ticket code"
              className="font-mono uppercase"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleTicketCheckIn();
              }}
            />
          </div>
          <Button
            className="hidden w-full sm:w-auto md:inline-flex"
            onClick={() => void handleTicketCheckIn()}
            disabled={checkingIn}
          >
            {checkingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
            Check in
          </Button>
        </CardContent>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={filter === item.id ? "default" : "outline"}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {selected.size > 0 && (
        <Card className="mb-4 border-primary/30">
          <CardContent className="flex flex-wrap items-center gap-2 py-4">
            <span className="text-sm font-medium">{selected.size} selected</span>
            {BULK_STATUSES.map((action) => (
              <Button
                key={action.status}
                size="sm"
                variant={action.destructive ? "destructive" : "outline"}
                disabled={bulkBusy}
                onClick={() => void handleBulkStatus(action.status, action.destructive)}
              >
                {action.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading && <LoadingState label="Loading attendance…" className="p-6" />}
          {isError && (
            <QueryErrorState message="Could not load attendance." onRetry={() => void refetch()} className="p-6" />
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <EmptyState
              title="No participants"
              description="Registrations and walk-ins for this event will appear here."
              className="p-6"
            />
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allFilteredSelected}
                          onCheckedChange={(v) => toggleAll(v === true)}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Evaluation</TableHead>
                      <TableHead className="min-w-[220px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(row.id)}
                            onCheckedChange={(v) => toggleRow(row.id, v === true)}
                            aria-label={`Select ${row.participantName}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{row.participantName}</div>
                          <div className="text-xs text-muted-foreground">{row.email}</div>
                          {row.ticketCode && (
                            <div className="font-mono text-xs text-muted-foreground">{row.ticketCode}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.organizationOrSchool ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.isWalkIn ? "Walk-in" : "Registered"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(row.status)}>
                            {ATTENDANCE_STATUS_LABELS[row.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.checkedInAt ? fmtDateTime(row.checkedInAt) : "—"}
                        </TableCell>
                        <TableCell>
                          {row.evaluationCompletedAt ? (
                            <Button variant="link" size="sm" className="h-auto p-0" asChild>
                              <Link to="/admin/events/$eventId/evaluations" params={{ eventId }}>
                                Yes
                              </Link>
                            </Button>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <AttendanceRowActions
                            row={row}
                            eventId={eventId}
                            adminUserId={user?.id ?? null}
                            onUpdated={refresh}
                            onEditNote={() => {
                              setNoteRow(row);
                              setNoteText(row.notes ?? "");
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="divide-y md:hidden">
                {filtered.map((row) => (
                  <div key={row.id} className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selected.has(row.id)}
                        onCheckedChange={(v) => toggleRow(row.id, v === true)}
                        aria-label={`Select ${row.participantName}`}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{row.participantName}</div>
                        <div className="text-sm text-muted-foreground">{row.email}</div>
                        {row.organizationOrSchool && (
                          <div className="text-sm text-muted-foreground">{row.organizationOrSchool}</div>
                        )}
                        {row.ticketCode && (
                          <div className="font-mono text-xs text-muted-foreground">{row.ticketCode}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{row.isWalkIn ? "Walk-in" : "Registered"}</Badge>
                      <Badge variant={statusVariant(row.status)}>
                        {ATTENDANCE_STATUS_LABELS[row.status]}
                      </Badge>
                      {row.evaluationCompletedAt ? (
                        <Button variant="link" size="sm" className="h-auto p-0" asChild>
                          <Link to="/admin/events/$eventId/evaluations" params={{ eventId }}>
                            Eval: Yes
                          </Link>
                        </Button>
                      ) : (
                        <Badge variant="outline">Eval: No</Badge>
                      )}
                    </div>
                    {row.checkedInAt && (
                      <p className="text-xs text-muted-foreground">Checked in {fmtDateTime(row.checkedInAt)}</p>
                    )}
                    <AttendanceRowActions
                      row={row}
                      eventId={eventId}
                      adminUserId={user?.id ?? null}
                      onUpdated={refresh}
                      onEditNote={() => {
                        setNoteRow(row);
                        setNoteText(row.notes ?? "");
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <WalkInFormDialog
        open={walkInOpen}
        onOpenChange={setWalkInOpen}
        eventId={eventId}
        adminUserId={user?.id ?? null}
        onSaved={refresh}
      />

      <AttendanceImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        eventId={eventId}
        adminUserId={user?.id ?? null}
        onImported={refresh}
      />

      <Dialog open={!!noteRow} onOpenChange={(open) => !open && setNoteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin note</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="attendance-note">Note for {noteRow?.participantName}</Label>
            <Textarea
              id="attendance-note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteRow(null)}>
              Cancel
            </Button>
            <Button onClick={() => void saveNote()} disabled={savingNote}>
              {savingNote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {dialog}
    </AdminShell>
  );
}
