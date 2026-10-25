import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AppButton, AppCard } from "@/components/design-system";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  getProcurementEventSettings,
  getProcurementProducts,
  money,
  requestProcurementQuote,
} from "@/lib/procurement";
import { toast } from "sonner";

export function ProcurementQuoteRequest({ eventId }: { eventId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: settings } = useQuery({
    queryKey: ["procurement-settings", eventId],
    queryFn: () => getProcurementEventSettings(eventId),
    retry: false,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["procurement-products", eventId],
    queryFn: () => getProcurementProducts(eventId),
    enabled: settings?.enabled === true,
  });
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [institutionName, setInstitutionName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [apEmail, setApEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [registrants, setRegistrants] = useState<{ name: string; email: string }[]>([]);
  const ticketCount = useMemo(() => products.filter((p) => p.kind === "ticket")
    .reduce((count, p) => count + (quantities[p.id] ?? 0), 0), [products, quantities]);
  const total = useMemo(() => products.reduce((sum, p) => sum + (quantities[p.id] ?? 0) * (p.price_cents ?? 0), 0), [products, quantities]);

  if (!settings?.enabled || products.length === 0) return null;

  function changeQuantity(productId: string, value: number) {
    const quantity = Math.max(0, Math.min(1000, Number.isFinite(value) ? Math.trunc(value) : 0));
    setQuantities((current) => ({ ...current, [productId]: quantity }));
    if (products.some((product) => product.id === productId && product.kind === "ticket")) {
      const nextCount = products.filter((product) => product.kind === "ticket")
        .reduce((count, product) => count + (product.id === productId ? quantity : (quantities[product.id] ?? 0)), 0);
      setRegistrants((current) => current.slice(0, nextCount));
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) {
      navigate({ to: "/auth", search: { next: `/events/${eventId}` } });
      return;
    }
    if (registrants.length !== ticketCount || registrants.some((r) => !r.name.trim())) {
      toast.error("Enter one attendee name for every admission ticket.");
      return;
    }
    const lines = products.filter((p) => (quantities[p.id] ?? 0) > 0)
      .map((p) => ({ productId: p.id, quantity: quantities[p.id] }));
    if (!lines.length) {
      toast.error("Select at least one ticket or add-on.");
      return;
    }
    setBusy(true);
    try {
      await requestProcurementQuote({ eventId, institutionName, contactName, contactEmail, department, apEmail, notes, lines, registrants });
      toast.success("Quote requested. No payment or registration has been confirmed yet.");
      navigate({ to: "/account/purchases" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not request quote");
    } finally {
      setBusy(false);
    }
  }

  return <AppCard variant="lift" padding="md" className="space-y-4">
    <div>
      <h2 className="text-xl font-black text-foreground">University or agency purchase order</h2>
      <p className="text-sm text-muted-foreground">Request a quote for institutional approval. You will not be charged now; registrations are pending until the organizer reviews the PO.</p>
      <p className="mt-1 text-xs text-muted-foreground">Seller: {settings.seller_name}</p>
    </div>
    {!expanded ? <AppButton variant="outline" size="lg" shape="pill" onClick={() => setExpanded(true)}>Request a quote</AppButton> :
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="po-institution">Institution or agency *</Label><Input id="po-institution" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} required maxLength={200} /></div>
          <div><Label htmlFor="po-department">Department</Label><Input id="po-department" value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={200} /></div>
          <div><Label htmlFor="po-contact">Billing contact *</Label><Input id="po-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} required maxLength={200} /></div>
          <div><Label htmlFor="po-contact-email">Billing email *</Label><Input id="po-contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required maxLength={320} /></div>
          <div><Label htmlFor="po-ap-email">Accounts Payable email</Label><Input id="po-ap-email" type="email" value={apEmail} onChange={(e) => setApEmail(e.target.value)} maxLength={320} /></div>
        </div>
        <fieldset className="space-y-2 rounded-lg border p-3">
          <legend className="px-1 font-semibold">Tickets and add-ons</legend>
          {products.filter((p) => p.price_cents !== null).map((product) => <div key={product.id} className="flex items-center justify-between gap-3">
            <Label htmlFor={`po-product-${product.id}`} className="flex-1">{product.name} · {money(product.price_cents!)}</Label>
            <Input id={`po-product-${product.id}`} type="number" min={0} max={1000} className="w-24" value={quantities[product.id] ?? 0} onChange={(e) => changeQuantity(product.id, Number(e.target.value))} />
          </div>)}
        </fieldset>
        {ticketCount > 0 && <fieldset className="space-y-2 rounded-lg border p-3">
          <legend className="px-1 font-semibold">Attendees · {ticketCount}</legend>
          {Array.from({ length: ticketCount }, (_, index) => <div key={index} className="grid gap-2 sm:grid-cols-2">
            <Input aria-label={`Attendee ${index + 1} name`} placeholder={`Attendee ${index + 1} name *`} value={registrants[index]?.name ?? ""} onChange={(e) => setRegistrants((current) => { const next = [...current]; next[index] = { name: e.target.value, email: next[index]?.email ?? "" }; return next; })} required />
            <Input aria-label={`Attendee ${index + 1} email`} type="email" placeholder="Email (optional)" value={registrants[index]?.email ?? ""} onChange={(e) => setRegistrants((current) => { const next = [...current]; next[index] = { name: next[index]?.name ?? "", email: e.target.value }; return next; })} />
          </div>)}
        </fieldset>}
        <div><Label htmlFor="po-notes">Invoice instructions or notes</Label><Textarea id="po-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} /></div>
        <div className="flex items-center justify-between border-t pt-3 font-bold"><span>Estimated quote total</span><span>{money(total)}</span></div>
        <p className="text-xs text-muted-foreground">The final quote uses the catalog prices saved by the organizer. Taxes, discounts, and payment terms will be confirmed before an invoice is issued.</p>
        <AppButton type="submit" variant="primary" size="lg" shape="pill" className="w-full" disabled={busy || !linesSelected(products, quantities)}>{busy ? "Requesting…" : user ? "Submit quote request" : "Sign in to request quote"}</AppButton>
      </form>}
  </AppCard>;
}

function linesSelected(products: { id: string }[], quantities: Record<string, number>) {
  return products.some((p) => (quantities[p.id] ?? 0) > 0);
}
