import { createLazyFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { EventFormDialog } from "@/components/admin/event-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadCsv } from "@/lib/csv";
import {
  checkInRegistration,
  deleteEvent,
  duplicateEvent,
  eventStatusLabel,
  fetchEventRegistrations,
  fetchAdminEvents,
  getEventAnalytics,
  registrationStatusLabel,
} from "@/lib/events";
import { fmtDateTime } from "@/lib/format";
import { useAdminDelete } from "@/hooks/use-admin-delete";
import { toast } from "sonner";
import { BarChart3, Copy, Pencil, Trash2, UserCheck, Users } from "lucide-react";

export const Route = createLazyFileRoute("/_authenticated/admin/events")({
  component: AdminEvents,
});

function EventRowActions({
  row,
  onAnalytics,
  onRegistrations,
  onDuplicate,
  onEdit,
  onDelete,
}: {
  row: { id: string; title: string };
  onAnalytics: () => void;
  onRegistrations: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      <Button size="icon" variant="ghost" className="h-10 w-10" onClick={onAnalytics} aria-label={`Analytics for ${row.title}`}>
        <BarChart3 className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className="h-10 w-10" onClick={onRegistrations} aria-label={`Registrations for ${row.title}`}>
        <Users className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className="h-10 w-10" onClick={onDuplicate} aria-label={`Duplicate ${row.title}`}>
        <Copy className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className="h-10 w-10" onClick={onEdit} aria-label={`Edit ${row.title}`}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" className="h-10 w-10" onClick={onDelete} aria-label={`Delete ${row.title}`}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function AdminEvents() {
  const qc = useQueryClient();
  const { confirmAndDelete, dialog } = useAdminDelete();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [regsOpen, setRegsOpen] = useState<string | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: ["admin-events"], queryFn: fetchAdminEvents });
  const rows = (data ?? []).filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()));

  const { data: regs } = useQuery({
    queryKey: ["event-regs-admin", regsOpen],
    enabled: !!regsOpen,
    queryFn: () => fetchEventRegistrations(regsOpen!),
  });

  const { data: analytics } = useQuery({
    queryKey: ["event-analytics", analyticsOpen],
    enabled: !!analyticsOpen,
    queryFn: () => getEventAnalytics(analyticsOpen!),
  });

  function openNew() {
    setEditingId(null);
    setOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setOpen(true);
  }

  async function del(id: string, title: string) {
    await confirmAndDelete({
      entityLabel: "event",
      itemName: title,
      description: `"${title}" and its registrations will be permanently removed.`,
      onDelete: () => deleteEvent(id),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["admin-events"] });
        qc.invalidateQueries({ queryKey: ["events"] });
        qc.invalidateQueries({ queryKey: ["home-page"] });
      },
    });
  }

  async function duplicate(id: string) {
    try {
      await duplicateEvent(id);
      toast.success("Event duplicated as draft");
      qc.invalidateQueries({ queryKey: ["admin-events"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Duplicate failed");
    }
  }

  async function handleCheckIn(registrationId: string) {
    if (!regsOpen) return;
    try {
      await checkInRegistration(registrationId, regsOpen);
      toast.success("Checked in");
      qc.invalidateQueries({ queryKey: ["event-regs-admin", regsOpen] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Check-in failed");
    }
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Events & Workshops"
        description="Manage workshops, conferences, trainings, registrations, and check-in."
        searchValue={q}
        onSearchChange={setQ}
        onNew={openNew}
        onExport={() =>
          downloadCsv("events", rows, [
            { header: "Title", get: (r) => r.title },
            { header: "Starts", get: (r) => r.startsAt },
            { header: "Status", get: (r) => eventStatusLabel(r.status) },
            { header: "Registration", get: (r) => registrationStatusLabel(r.registrationStatus) },
            { header: "Capacity", get: (r) => r.capacity },
            { header: "Registered", get: (r) => r.registrationCount },
            { header: "Featured", get: (r) => (r.isFeatured ? "Yes" : "No") },
          ])
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="w-40" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No events.</TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDateTime(row.startsAt)}</TableCell>
                    <TableCell><Badge variant={row.status === "published" ? "default" : "secondary"}>{eventStatusLabel(row.status)}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{registrationStatusLabel(row.registrationStatus)}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.registrationCount}{row.capacity != null ? ` / ${row.capacity}` : ""}
                    </TableCell>
                    <TableCell>
                      <EventRowActions
                        row={row}
                        onAnalytics={() => setAnalyticsOpen(row.id)}
                        onRegistrations={() => setRegsOpen(row.id)}
                        onDuplicate={() => duplicate(row.id)}
                        onEdit={() => openEdit(row.id)}
                        onDelete={() => del(row.id, row.title)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y md:hidden">
            {rows.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No events.</p>
            )}
            {rows.map((row) => (
              <div key={row.id} className="space-y-3 p-4">
                <div>
                  <div className="font-medium">{row.title}</div>
                  <div className="text-sm text-muted-foreground">{fmtDateTime(row.startsAt)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={row.status === "published" ? "default" : "secondary"}>{eventStatusLabel(row.status)}</Badge>
                  <Badge variant="outline">{registrationStatusLabel(row.registrationStatus)}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {row.registrationCount}{row.capacity != null ? ` / ${row.capacity}` : ""} registered
                  </span>
                </div>
                <EventRowActions
                  row={row}
                  onAnalytics={() => setAnalyticsOpen(row.id)}
                  onRegistrations={() => setRegsOpen(row.id)}
                  onDuplicate={() => duplicate(row.id)}
                  onEdit={() => openEdit(row.id)}
                  onDelete={() => del(row.id, row.title)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <EventFormDialog
        open={open}
        onOpenChange={setOpen}
        eventId={editingId}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["admin-events"] });
          qc.invalidateQueries({ queryKey: ["events"] });
          qc.invalidateQueries({ queryKey: ["home-page"] });
        }}
      />

      <Dialog open={!!regsOpen} onOpenChange={(v) => !v && setRegsOpen(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>Registrations & check-in</DialogTitle></DialogHeader>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() =>
              downloadCsv("event-registrations", regs ?? [], [
                { header: "Name", get: (r) => r.fullName },
                { header: "Email", get: (r) => r.email },
                { header: "Status", get: (r) => r.status },
                { header: "Ticket", get: (r) => r.ticketCode },
                { header: "Checked in", get: (r) => r.checkedInAt },
                { header: "Notes", get: (r) => r.notes },
              ])
            }
          >
            Export CSV
          </Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ticket</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(regs ?? []).map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell>
                    <div className="font-medium">{reg.fullName}</div>
                    <div className="text-xs text-muted-foreground">{reg.email}</div>
                  </TableCell>
                  <TableCell>{reg.status}</TableCell>
                  <TableCell className="font-mono text-xs">{reg.ticketCode}</TableCell>
                  <TableCell>
                    {!reg.checkedInAt && reg.status === "registered" && (
                      <Button size="sm" variant="outline" onClick={() => handleCheckIn(reg.id)}>
                        <UserCheck className="h-4 w-4" /> Check in
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={!!analyticsOpen} onOpenChange={(v) => !v && setAnalyticsOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Event analytics</DialogTitle></DialogHeader>
          {analytics && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-4"><div className="text-2xl font-bold">{analytics.registered}</div><div className="text-sm text-muted-foreground">Registered</div></div>
              <div className="rounded-lg border p-4"><div className="text-2xl font-bold">{analytics.waitingList}</div><div className="text-sm text-muted-foreground">Waiting list</div></div>
              <div className="rounded-lg border p-4"><div className="text-2xl font-bold">{analytics.checkedIn}</div><div className="text-sm text-muted-foreground">Checked in</div></div>
              <div className="rounded-lg border p-4"><div className="text-2xl font-bold">{analytics.cancelled}</div><div className="text-sm text-muted-foreground">Cancelled</div></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {dialog}
    </AdminShell>
  );
}
