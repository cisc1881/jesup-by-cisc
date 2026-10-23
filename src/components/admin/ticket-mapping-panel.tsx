import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { readTicketMappings, saveTicketMapping, issueMappedCredentials } from "@/lib/ticket-mapping.functions";

type Product = { id: string; name: string; is_active: boolean; beneficiary: string; price_cents: number | null };
type Preview = Record<string, number | boolean>;

export function TicketMappingPanel({ eventId, products }: { eventId: string; products: Product[] }) {
  const read = useServerFn(readTicketMappings), save = useServerFn(saveTicketMapping), issue = useServerFn(issueMappedCredentials);
  const query = useQuery({ queryKey: ["ticket-mappings", eventId], queryFn: () => read({ data: { eventId } }) });
  const [ticketClass, setTicketClass] = useState(""), [productId, setProductId] = useState(""), [qty, setQty] = useState("1");
  const [allowUnpriced, setAllowUnpriced] = useState(false), [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null), [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? "Product";

  async function act(fn: () => Promise<unknown>, ok?: string) {
    setBusy(true);
    try { await fn(); await query.refetch(); if (ok) toast.success(ok); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); }
    finally { setBusy(false); }
  }
  async function runPreview() {
    setBusy(true);
    try { setPreview(await issue({ data: { eventId, requestId, commit: false, allowUnpriced } })); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Preview failed"); }
    finally { setBusy(false); }
  }
  async function commit() {
    setBusy(true);
    try {
      const r = await issue({ data: { eventId, requestId, commit: true, allowUnpriced } });
      setPreview(r); setRequestId(crypto.randomUUID());
      toast.success(`${r.replayed ? "Already applied" : "Issued"}: ${r.issue} credentials`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Issuance failed"); }
    finally { setBusy(false); }
  }

  if (query.isPending) return <p role="status">Loading ticket types…</p>;
  if (query.error) return <p role="alert">{query.error.message}</p>;
  const { classes, mappings } = query.data;
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Link each imported Eventbrite ticket type to existing products (meals, activities, parking). Mapping never sets prices or activates products. Guest and company products still need a name and are issued from Issued credentials.
      </p>
      {!classes.length ? <p>No ticket types yet. Import an Eventbrite CSV that includes the Ticket Type column.</p> : (
        <ul className="divide-y rounded-lg border">
          {classes.map((c) => (
            <li key={c.ticketClass} className="space-y-1 p-3">
              <p className="font-semibold">{c.ticketClass} <span className="text-sm font-normal text-muted-foreground">· {c.registered} registered · {c.cancelled} cancelled</span></p>
              {mappings.filter((m) => m.ticket_class === c.ticketClass).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>{name(m.product_id)} × {m.quantity}</span>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void act(() => save({ data: { eventId, ticketClass: m.ticket_class, productId: m.product_id, quantity: m.quantity, remove: true } }), "Mapping removed")}>Remove</Button>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
      {classes.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Select value={ticketClass} onValueChange={setTicketClass}><SelectTrigger aria-label="Eventbrite ticket type"><SelectValue placeholder="Ticket type" /></SelectTrigger><SelectContent>{classes.map((c) => <SelectItem key={c.ticketClass} value={c.ticketClass}>{c.ticketClass}</SelectItem>)}</SelectContent></Select>
          <Select value={productId} onValueChange={setProductId}><SelectTrigger aria-label="Mapped product"><SelectValue placeholder="Product" /></SelectTrigger><SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}{p.is_active ? "" : " (inactive)"}</SelectItem>)}</SelectContent></Select>
          <Input aria-label="Quantity per attendee" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
          <Button className="sm:col-span-3 sm:w-fit" disabled={busy || !ticketClass || !productId} onClick={() => void act(() => save({ data: { eventId, ticketClass, productId, quantity: Number(qty), remove: false } }), "Mapping saved")}>Save mapping</Button>
        </div>
      )}
      {mappings.length > 0 && (
        <div className="space-y-3 rounded-lg border p-4">
          <h3 className="font-semibold">Issue mapped credentials</h3>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={allowUnpriced} onCheckedChange={(v) => { setAllowUnpriced(v === true); setPreview(null); }} />Explicitly approve unpriced products</label>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" disabled={busy} onClick={() => void runPreview()}>Preview</Button>
            <Button disabled={busy || !preview || preview.dry_run !== true || !Number(preview.issue)} onClick={() => void commit()}>Issue {preview?.dry_run ? String(preview.issue) : ""} credentials</Button>
          </div>
          {preview && (
            <p role="status" className="text-sm">
              {String(preview.registrations)} registrations matched · {String(preview.issue)} to issue · {String(preview.already_issued)} already issued · {String(preview.inactive_product)} skipped (inactive product) · {String(preview.needs_guest_name)} need guest/company name · {String(preview.needs_unpriced_approval)} need unpriced approval
            </p>
          )}
        </div>
      )}
    </div>
  );
}
