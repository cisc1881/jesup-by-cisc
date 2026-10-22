import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import { QrTicketScanner } from "@/components/admin/qr-ticket-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildPageHead, formatUserErrorMessage } from "@/lib/seo";
import { ArrowLeft, ScanLine } from "lucide-react";

export const Route = createFileRoute("/_authenticated/events/$id/scan")({
  head: () => buildPageHead({ title: "Event staff scanner · JESUP", description: "Authorized event admission and issued-credential redemption.", noindex: true }),
  component: EventStaffScanner,
});

function EventStaffScanner() {
  const { id } = Route.useParams();
  const [mode, setMode] = useState<"checkin" | "redemption">("checkin");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: access, isLoading, error: accessError } = useQuery({
    queryKey: ["event-staff-access", id],
    queryFn: async () => {
      const [checkin, redemption] = await Promise.all([
        supabase.rpc("can_operate_event", { p_event_id: id, p_operation: "checkin" }),
        supabase.rpc("can_operate_event", { p_event_id: id, p_operation: "redemption" }),
      ]);
      if (checkin.error) throw checkin.error;
      if (redemption.error) throw redemption.error;
      return { checkin: checkin.data, redemption: redemption.data };
    },
  });
  async function scan(value: string) {
    if (!value.trim() || busy || !access?.[mode]) return;
    setBusy(true); setError(null); setResult(null);
    try {
      if (mode === "checkin") {
        const { data, error } = await supabase.rpc("scan_event_admission", { p_event_id: id, p_code: value.trim() });
        if (error) throw error;
        const row = data?.[0];
        if (!row) throw new Error("Check-in was not recorded.");
        setResult(`${row.attendee_name} · ${row.already_checked_in ? "Already checked in" : "Checked in"}`);
      } else {
        const { data, error } = await supabase.rpc("redeem_event_entitlement", { p_event_id: id, p_code: value.trim() });
        if (error) throw error;
        const row = data?.[0];
        if (!row) throw new Error("Redemption was not recorded.");
        setResult(`Redeemed · ${row.used_count} used · ${row.remaining} remaining`);
      }
      setCode("");
    } catch (error) { setError(formatUserErrorMessage(error, "Credential could not be accepted.")); }
    finally { setBusy(false); }
  }
  return <PublicLayout><PageContainer size="md" className="pb-bottom-nav space-y-6">
    <Button variant="ghost" asChild><Link to="/events/$id" params={{ id }}><ArrowLeft className="size-4" />Back to event</Link></Button>
    <h1 className="text-3xl font-bold">Event staff scanner</h1>
    {isLoading ? <p role="status">Checking staff access…</p> : accessError ? <p role="alert">Staff access could not be verified.</p> : !access?.checkin && !access?.redemption ? <p role="alert">You aren’t assigned to scan at this event.</p> : <>
      <Tabs value={mode} onValueChange={value => { if (value === "checkin" || value === "redemption") { setMode(value); setResult(null); setError(null); } }}><TabsList><TabsTrigger value="checkin" disabled={!access?.checkin}>Admission</TabsTrigger><TabsTrigger value="redemption" disabled={!access?.redemption}>Redemption</TabsTrigger></TabsList></Tabs>
      {result && <p role="status" className="border border-primary bg-secondary p-5 text-xl font-bold">{result}</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <QrTicketScanner continuous disabled={busy || !access?.[mode]} onDetected={scan} />
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); void scan(code); }}><Label htmlFor="staff-code">Credential code</Label><div className="flex flex-col gap-3 sm:flex-row"><Input id="staff-code" autoComplete="off" value={code} onChange={event => setCode(event.target.value)} /><Button disabled={busy || !code.trim() || !access?.[mode]} type="submit"><ScanLine className="size-4" />{busy ? "Validating…" : "Validate"}</Button></div></form>
    </>}
  </PageContainer></PublicLayout>;
}