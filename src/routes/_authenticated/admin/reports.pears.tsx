import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CommandCenterContentShell, CommandCenterPageHeader } from "@/modules/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getEventReportSummary, getMultiEventReportSummary } from "@/lib/event-reporting";
import { buildPearsReviewPayload } from "@/lib/pears";

export const Route = createFileRoute("/_authenticated/admin/reports/pears")({
  component: PearsPage,
});

function PearsPage() {
  const qc = useQueryClient();
  const [institutionId, setInstitutionId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [connectionId, setConnectionId] = useState("");
  const [eventId, setEventId] = useState("");
  const [activityId, setActivityId] = useState("");
  const [programId, setProgramId] = useState("");
  const [pearsProgramId, setPearsProgramId] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pears-setup"],
    queryFn: async () => {
      const [institutions, connections, events, programs, programEvents, mappings, jobs] =
        await Promise.all([
          supabase.from("institutions").select("id, name").eq("is_active", true).order("name"),
          supabase.from("pears_connections").select("*").order("created_at"),
          supabase
            .from("events")
            .select("id, title, starts_at")
            .order("starts_at", { ascending: false })
            .limit(100),
          supabase.from("programs").select("id, name").eq("is_active", true).order("name"),
          supabase.from("program_events").select("program_id, event_id"),
          supabase.from("pears_mappings").select("*"),
          supabase
            .from("pears_export_jobs")
            .select("id, connection_id, event_id, payload, status, updated_at")
            .order("updated_at", { ascending: false })
            .limit(50),
        ]);
      for (const result of [
        institutions,
        connections,
        events,
        programs,
        programEvents,
        mappings,
        jobs,
      ])
        if (result.error) throw result.error;
      return {
        institutions: institutions.data ?? [],
        connections: connections.data ?? [],
        events: events.data ?? [],
        programs: programs.data ?? [],
        programEvents: programEvents.data ?? [],
        mappings: mappings.data ?? [],
        jobs: jobs.data ?? [],
      };
    },
  });

  const selectedConnection = data?.connections.find((row) => row.id === connectionId);
  const selectedMapping = data?.mappings.find(
    (row) =>
      row.connection_id === connectionId && row.entity_type === "event" && row.jesup_id === eventId,
  );
  const selectedProgramMapping = data?.mappings.find(
    (row) =>
      row.connection_id === connectionId &&
      row.entity_type === "program" &&
      row.jesup_id === programId,
  );
  const programEventIds =
    data?.programEvents.filter((row) => row.program_id === programId).map((row) => row.event_id) ??
    [];
  const { data: programImpact, isLoading: impactLoading } = useQuery({
    queryKey: ["pears-program-impact", programId, programEventIds],
    queryFn: () => getMultiEventReportSummary(programEventIds),
    enabled: programEventIds.length > 0,
  });

  function downloadPackage(payload: unknown, eventId: string) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jesup-pears-review-${eventId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function saveConnection() {
    if (!institutionId || !organizationId.trim())
      return toast.error("Select an institution and enter its PEARS organization ID.");
    setBusy(true);
    try {
      const { error } = await supabase
        .from("pears_connections")
        .upsert(
          { institution_id: institutionId, organization_id: organizationId.trim(), environment: "sandbox" },
          { onConflict: "institution_id" },
        );
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["pears-setup"] });
      toast.success("PEARS organization saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save connection.");
    } finally {
      setBusy(false);
    }
  }

  async function prepareExport() {
    if (!selectedConnection || !eventId || !activityId.trim())
      return toast.error("Select a connection and event, then enter the PEARS activity ID.");
    setBusy(true);
    try {
      const report = await getEventReportSummary(eventId);
      const payload = buildPearsReviewPayload({
        organizationId: selectedConnection.organization_id,
        pearsActivityId: activityId.trim(),
        report,
      });
      const { error: mappingError } = await supabase
        .from("pears_mappings")
        .upsert(
          {
            connection_id: connectionId,
            entity_type: "event",
            jesup_id: eventId,
            pears_id: activityId.trim(),
          },
          { onConflict: "connection_id,entity_type,jesup_id" },
        );
      if (mappingError) throw mappingError;
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sign in again to prepare the export.");
      const { data: existingJob, error: lookupError } = await supabase
        .from("pears_export_jobs")
        .select("id")
        .eq("connection_id", connectionId)
        .eq("event_id", eventId)
        .maybeSingle();
      if (lookupError) throw lookupError;
      const { error: jobError } = existingJob
        ? await supabase.from("pears_export_jobs").update({ payload, status: "draft" }).eq("id", existingJob.id)
        : await supabase.from("pears_export_jobs").insert({
            connection_id: connectionId,
            event_id: eventId,
            payload,
            status: "draft",
            created_by: auth.user.id,
          });
      if (jobError) throw jobError;
      await qc.invalidateQueries({ queryKey: ["pears-setup"] });
      downloadPackage(payload, eventId);
      toast.success("Review package saved and downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not prepare review package.");
    } finally {
      setBusy(false);
    }
  }

  async function saveProgramMapping() {
    if (!connectionId || !programId || !pearsProgramId.trim())
      return toast.error("Select a connection and program, then enter the PEARS program ID.");
    setBusy(true);
    try {
      const { error } = await supabase
        .from("pears_mappings")
        .upsert(
          {
            connection_id: connectionId,
            entity_type: "program",
            jesup_id: programId,
            pears_id: pearsProgramId.trim(),
          },
          { onConflict: "connection_id,entity_type,jesup_id" },
        );
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["pears-setup"] });
      toast.success("Program mapping saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save program mapping.");
    } finally {
      setBusy(false);
    }
  }

  async function markReviewed(jobId: string) {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("pears_export_jobs")
        .update({ status: "reviewed" })
        .eq("id", jobId);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["pears-setup"] });
      toast.success("Package marked reviewed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update package.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CommandCenterContentShell>
      <CommandCenterPageHeader
        title="PEARS preparation"
        description="Map JESUP events to your institution's PEARS identifiers and review aggregate reporting data before transfer."
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/reports">Reports</Link>
          </Button>
        }
      />
      <p className="mb-6 text-sm text-muted-foreground">
        This exports a JESUP review package. It does not submit to PEARS or claim to match a PEARS
        import template.
      </p>
      <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        API keys are not yet available in the PEARS sandbox used for this pilot. PEARS labels them
        as coming soon with the Data Mart add-on. Live sync requires API access and write
        documentation. For early access, contact{" "}
        <a className="underline" href="https://pears.io/contact/" target="_blank" rel="noreferrer">PEARS support</a>.
      </div>
      {isLoading && <p>Loading PEARS setup…</p>}
      {error && (
        <p role="alert">
          Could not load PEARS setup: {error.message}. Apply the PEARS database migration first.
        </p>
      )}
      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Institution connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pears-institution">JESUP institution</Label>
                <select
                  id="pears-institution"
                  className="mt-1 w-full rounded-md border bg-background p-2"
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                >
                  <option value="">Choose institution</option>
                  {data.institutions.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="pears-org-id">PEARS organization ID</Label>
                <Input
                  id="pears-org-id"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                />
              </div>
              <Button disabled={busy} onClick={saveConnection}>
                Save organization
              </Button>
              <div className="space-y-2 pt-2">
                {data.connections.map((row) => (
                  <div key={row.id} className="rounded-md border p-3 text-sm">
                    {data.institutions.find((institution) => institution.id === row.institution_id)
                      ?.name ?? row.institution_id}{" "}
                    · {row.organization_id} · {row.environment} · {row.status}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Event review package</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pears-connection">Institution connection</Label>
                <select
                  id="pears-connection"
                  className="mt-1 w-full rounded-md border bg-background p-2"
                  value={connectionId}
                  onChange={(e) => setConnectionId(e.target.value)}
                >
                  <option value="">Choose connection</option>
                  {data.connections.map((row) => (
                    <option key={row.id} value={row.id}>
                      {data.institutions.find(
                        (institution) => institution.id === row.institution_id,
                      )?.name ?? row.organization_id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="pears-event">JESUP event</Label>
                <select
                  id="pears-event"
                  className="mt-1 w-full rounded-md border bg-background p-2"
                  value={eventId}
                  onChange={(e) => {
                    setEventId(e.target.value);
                    setActivityId("");
                  }}
                >
                  <option value="">Choose event</option>
                  {data.events.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.title} · {new Date(row.starts_at).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="pears-activity-id">PEARS activity ID</Label>
                <Input
                  id="pears-activity-id"
                  value={activityId}
                  placeholder={selectedMapping?.pears_id ?? ""}
                  onChange={(e) => setActivityId(e.target.value)}
                />
              </div>
              <Button disabled={busy} onClick={prepareExport}>
                Save mapping and download review package
              </Button>
              <p className="text-xs text-muted-foreground">
                The package includes event details, attendance totals, geographic reach, and
                aggregate evaluation metrics. It excludes participant names, contact details,
                quotes, and individual demographic responses.
              </p>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Program impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="pears-program">JESUP program</Label>
                  <select
                    id="pears-program"
                    className="mt-1 w-full rounded-md border bg-background p-2"
                    value={programId}
                    onChange={(e) => {
                      setProgramId(e.target.value);
                      setPearsProgramId("");
                    }}
                  >
                    <option value="">Choose program</option>
                    {data.programs.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="pears-program-id">PEARS program ID</Label>
                  <Input
                    id="pears-program-id"
                    value={pearsProgramId}
                    placeholder={selectedProgramMapping?.pears_id ?? ""}
                    onChange={(e) => setPearsProgramId(e.target.value)}
                  />
                </div>
              </div>
              <Button disabled={busy} onClick={saveProgramMapping}>
                Save program mapping
              </Button>
              {programId && (
                <div className="rounded-md border p-4 text-sm">
                  {impactLoading ? (
                    "Calculating linked event impact…"
                  ) : programImpact ? (
                    <div className="grid gap-3 sm:grid-cols-4">
                      <p>
                        <strong>{programImpact.eventCount}</strong>
                        <br />
                        linked events
                      </p>
                      <p>
                        <strong>{programImpact.attendance.registrations}</strong>
                        <br />
                        registrations
                      </p>
                      <p>
                        <strong>{programImpact.geography.countiesServed}</strong>
                        <br />
                        counties reached
                      </p>
                      <p>
                        <strong>{programImpact.evaluation.completedResponses}</strong>
                        <br />
                        completed evaluations
                      </p>
                    </div>
                  ) : (
                    "No linked events yet."
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Registration totals can include the same person across multiple events. Review
                    institution attribution before reporting.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Prepared packages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No packages prepared yet.</p>
              ) : (
                data.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm"
                  >
                    <span className="mr-auto">
                      {data.events.find((event) => event.id === job.event_id)?.title ??
                        job.event_id}{" "}
                      · {job.status} · {new Date(job.updated_at).toLocaleString()}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadPackage(job.payload, job.event_id)}
                    >
                      Download
                    </Button>
                    {job.status === "draft" && (
                      <Button size="sm" disabled={busy} onClick={() => markReviewed(job.id)}>
                        Mark reviewed
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </CommandCenterContentShell>
  );
}
