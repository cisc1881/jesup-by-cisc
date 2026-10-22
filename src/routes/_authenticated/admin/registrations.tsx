import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { UserCheck } from "lucide-react";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/csv";
import { checkInRegistration } from "@/lib/events";
import { fmtDateTime } from "@/lib/format";
import { toast } from "sonner";
import { syncEventbriteRegistrationsServerFn } from "@/lib/eventbrite-sync-server-fn";

export const Route = createFileRoute("/_authenticated/admin/registrations")({
  component: AdminRegistrations,
});

type RegistrationRow = {
  id: string;
  eventId: string;
  eventTitle: string;
  fullName: string | null;
  email: string | null;
  status: string;
  ticketCode: string | null;
  checkedInAt: string | null;
  createdAt: string;
  source: string;
  dietaryRestrictions: string | null;
  foodAllergies: string | null;
  accessibilityAccommodations: string | null;
  accommodationConsent: boolean;
};

async function fetchAllRegistrations(): Promise<RegistrationRow[]> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("id, event_id, attendee_name, attendee_email, registration_source, status, ticket_code, checked_in_at, created_at, dietary_restrictions, food_allergies, accessibility_accommodations, accommodation_consent, events ( title ), profiles ( full_name, email )")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const event = row.events as { title: string } | null;
    const profile = row.profiles as { full_name: string | null; email: string | null } | null;
    return {
      id: row.id,
      eventId: row.event_id,
      eventTitle: event?.title ?? "Event",
      fullName: profile?.full_name ?? row.attendee_name ?? null,
      email: profile?.email ?? row.attendee_email ?? null,
      status: row.status,
      ticketCode: row.ticket_code,
      checkedInAt: row.checked_in_at,
      createdAt: row.created_at,
      source: row.registration_source,
      dietaryRestrictions: row.dietary_restrictions,
      foodAllergies: row.food_allergies,
      accessibilityAccommodations: row.accessibility_accommodations,
      accommodationConsent: row.accommodation_consent,
    };
  });
}

function AdminRegistrations() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [syncing, setSyncing] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-registrations"],
    queryFn: fetchAllRegistrations,
  });

  const rows = (data ?? []).filter((row) => {
    const haystack = `${row.fullName ?? ""} ${row.email ?? ""} ${row.eventTitle} ${row.ticketCode ?? ""}`.toLowerCase();
    return !q || haystack.includes(q.toLowerCase());
  });

  async function checkIn(row: RegistrationRow) {
    try {
      await checkInRegistration(row.id, row.eventId);
      toast.success(`${row.fullName ?? "Guest"} checked in`);
      await qc.invalidateQueries({ queryKey: ["admin-registrations"] });
    } catch (checkInError) {
      toast.error(checkInError instanceof Error ? checkInError.message : "Check-in failed");
    }
  }

  async function syncEventbrite() {
    setSyncing(true);
    try {
      const result = await syncEventbriteRegistrationsServerFn();
      await qc.invalidateQueries({ queryKey: ["admin-registrations"] });
      await qc.invalidateQueries({ queryKey: ["command-center-dashboard"] });
      toast.success(`Eventbrite synced: ${result.imported} new, ${result.updated} updated.`);
      for (const report of result.reports.filter((r) => !r.ok)) toast.error(`${report.title}: ${report.error}`);
      const flagged = result.reports.reduce((n, r) => n + (r.counts?.conflict ?? 0) + (r.counts?.invalid ?? 0), 0);
      if (flagged) toast.warning(`${flagged} attendee rows need review (conflicts or invalid). Use the event's Eventbrite CSV import preview for line details.`);
    } catch (syncError) {
      toast.error(syncError instanceof Error ? syncError.message : "Eventbrite sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Event Registrations"
        description="View JESUP registrations across all events, export attendee lists, and manage check-in."
        searchValue={q}
        onSearchChange={setQ}
        actions={
          <Button type="button" variant="outline" disabled={syncing} onClick={() => void syncEventbrite()}>
            {syncing ? "Syncing Eventbrite…" : "Sync Eventbrite"}
          </Button>
        }
        onExport={() => downloadCsv("event-registrations", rows, [
          { header: "Event", get: (row) => row.eventTitle },
          { header: "Name", get: (row) => row.fullName },
          { header: "Email", get: (row) => row.email },
          { header: "Status", get: (row) => row.status },
          { header: "Source", get: (row) => row.source },
          { header: "Ticket", get: (row) => row.ticketCode },
          { header: "Registered", get: (row) => row.createdAt },
          { header: "Checked in", get: (row) => row.checkedInAt },
        ])}
      />

      <Card>
        <CardContent className="p-0">
          {error ? (
            <p className="p-8 text-center text-sm text-destructive">Unable to load registrations.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registrant</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No JESUP event registrations found.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.fullName ?? "Guest"}</div>
                      <div className="text-xs text-muted-foreground">{row.email ?? "No email"}</div>
                      {row.ticketCode && <div className="font-mono text-xs text-muted-foreground">{row.ticketCode}</div>}
                      <div className="text-xs capitalize text-muted-foreground">{row.source}</div>
                      {row.accommodationConsent && (row.dietaryRestrictions || row.foodAllergies || row.accessibilityAccommodations) && (
                        <div className="mt-2 space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-foreground">
                          {row.foodAllergies && <div><strong>Allergy:</strong> {row.foodAllergies}</div>}
                          {row.dietaryRestrictions && <div><strong>Dietary:</strong> {row.dietaryRestrictions}</div>}
                          {row.accessibilityAccommodations && <div><strong>Accessibility:</strong> {row.accessibilityAccommodations}</div>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/admin/events/$eventId/attendance"
                        params={{ eventId: row.eventId }}
                        className="font-medium text-primary hover:underline"
                      >
                        {row.eventTitle}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.checkedInAt ? "default" : "outline"}>
                        {row.checkedInAt ? "Checked in" : row.status.replaceAll("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{fmtDateTime(row.createdAt)}</TableCell>
                    <TableCell>
                      {!row.checkedInAt && row.status === "registered" && (
                        <Button size="sm" variant="outline" onClick={() => checkIn(row)}>
                          <UserCheck className="h-4 w-4" /> Check in
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Paid Eventbrite attendees will appear here after Eventbrite order synchronization is enabled.
      </p>
    </AdminShell>
  );
}
