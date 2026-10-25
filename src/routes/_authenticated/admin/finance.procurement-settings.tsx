import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { getProcurementEventSettings, getProcurementProducts, saveProcurementEventSettings } from "@/lib/procurement";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/finance/procurement-settings")({ component: ProcurementSettings });

function ProcurementSettings() {
  const queryClient = useQueryClient();
  const { data: events = [] } = useQuery({ queryKey: ["procurement-admin-events"], queryFn: async () => {
    const { data, error } = await supabase.from("events").select("id,title,slug").order("starts_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }});
  const [eventId, setEventId] = useState("");
  const { data: settings, isLoading } = useQuery({ queryKey: ["procurement-settings", eventId], queryFn: () => getProcurementEventSettings(eventId), enabled: !!eventId, retry: false });
  const { data: products = [] } = useQuery({ queryKey: ["procurement-products-admin", eventId], queryFn: () => getProcurementProducts(eventId), enabled: !!eventId });
  const [enabled, setEnabled] = useState(false);
  const [seller, setSeller] = useState("");
  const [remit, setRemit] = useState("");
  const [terms, setTerms] = useState("net_30");
  const [expires, setExpires] = useState(30);
  const [confirmOn, setConfirmOn] = useState("po_approved");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setSeller(settings.seller_name ?? "");
      setRemit(settings.remit_instructions ?? "");
      setTerms(settings.terms);
      setExpires(settings.quote_expiration_days);
      setConfirmOn(settings.confirm_registration_on);
    } else {
      setEnabled(false);
      setSeller("");
      setRemit("");
      setTerms("net_30");
      setExpires(30);
      setConfirmOn("po_approved");
    }
  }, [settings, eventId]);

  const priced = products.some((product) => product.kind === "ticket" && product.price_cents !== null);
  async function save() {
    if (!eventId) return;
    if (enabled && (!seller.trim() || !remit.trim() || !priced)) {
      toast.error("Set a seller, remittance instructions, and at least one active priced admission ticket before enabling.");
      return;
    }
    setSaving(true);
    try {
      await saveProcurementEventSettings({ eventId, enabled, sellerName: seller.trim(), remitInstructions: remit.trim(), terms, quoteExpirationDays: expires, confirmOn });
      await queryClient.invalidateQueries({ queryKey: ["procurement-settings", eventId] });
      toast.success(enabled ? "Institutional purchasing enabled for this event." : "PO settings saved with requests disabled.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save settings"); }
    finally { setSaving(false); }
  }

  return <AdminShell>
    <AdminPageHeader title="Purchase order settings" description="Configure each event before institutions can request quotes." />
    <Card className="max-w-3xl"><CardContent className="space-y-5 p-6">
      <div><Label htmlFor="po-event">Event</Label><select id="po-event" className="min-h-11 w-full rounded border bg-background px-3" value={eventId} onChange={(event) => setEventId(event.target.value)}>
        <option value="">Select an event</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
      </select></div>
      {eventId && !isLoading && <>
        <p className="text-sm text-muted-foreground">{priced ? "An active priced admission ticket is available." : "No active priced admission ticket is available. Configure the event catalog first."}</p>
        <div><Label htmlFor="po-seller">Seller and invoice payee</Label><Input id="po-seller" value={seller} onChange={(event) => setSeller(event.target.value)} maxLength={200} placeholder="Legal business name" /></div>
        <div><Label htmlFor="po-remit">Remittance instructions</Label><Textarea id="po-remit" value={remit} onChange={(event) => setRemit(event.target.value)} maxLength={2000} placeholder="Approved remittance address or payment instructions" /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="po-terms">Invoice terms</Label><select id="po-terms" className="min-h-11 w-full rounded border bg-background px-3" value={terms} onChange={(event) => setTerms(event.target.value)}>{["due_on_receipt","net_15","net_30","net_45","net_60"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></div>
          <div><Label htmlFor="po-expiry">Quote expiration (days)</Label><Input id="po-expiry" type="number" min={1} max={365} value={expires} onChange={(event) => setExpires(Number(event.target.value))} /></div></div>
        <div><Label htmlFor="po-confirm">Registration threshold</Label><select id="po-confirm" className="min-h-11 w-full rounded border bg-background px-3" value={confirmOn} onChange={(event) => setConfirmOn(event.target.value)}><option value="po_approved">After PO approval</option><option value="invoice_paid">After invoice is paid</option></select><p className="mt-1 text-xs text-muted-foreground">Attendees stay pending until staff confirms and links their registrations.</p></div>
        <div className="flex items-center justify-between rounded border p-3"><Label htmlFor="po-enabled">Accept institutional quote requests</Label><Switch id="po-enabled" checked={enabled} onCheckedChange={setEnabled} /></div>
        <Button disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save PO settings"}</Button>
      </>}
    </CardContent></Card>
  </AdminShell>;
}
