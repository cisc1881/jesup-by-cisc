import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { approveProcurementPo, getProcurementOrder, issueProcurementInvoice, issueProcurementQuote, money, recordProcurementPayment } from "@/lib/procurement";
import { getProcurementDocumentDownload } from "@/lib/procurement-documents.functions";
import { getProcurementPdf } from "@/lib/procurement-pdf.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/finance/purchase-orders/$id")({ component: PurchaseOrderReview });

function PurchaseOrderReview() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const download = useServerFn(getProcurementDocumentDownload);
  const getPdf = useServerFn(getProcurementPdf);
  const { data: order, isLoading, error } = useQuery({ queryKey: ["admin-procurement-order", id], queryFn: () => getProcurementOrder(id), retry: false });
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("check");
  const [reference, setReference] = useState("");

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-procurement-order", id] }),
        qc.invalidateQueries({ queryKey: ["admin-procurement-orders"] }),
      ]);
    } catch (actionError) { toast.error(actionError instanceof Error ? actionError.message : "Action failed"); }
    finally { setBusy(false); }
  }

  return <AdminShell>
    <AdminPageHeader title="Purchase order review" description="Approve the official PO, issue the invoice, and reconcile actual payments." />
    <Button variant="outline" asChild className="mb-4"><Link to="/admin/finance/purchase-orders">All purchase orders</Link></Button>
    {isLoading && <p>Loading purchase…</p>}
    {error && <Card><CardContent className="p-6 text-destructive">Purchase not found or unavailable.</CardContent></Card>}
    {order && <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardContent className="space-y-3 p-6">
        <div className="flex items-start justify-between gap-2"><div><h2 className="text-xl font-black">{order.institution_name}</h2><p className="text-sm text-muted-foreground">{order.events?.title}</p></div><Badge>{order.procurement_status.replaceAll("_", " ")}</Badge></div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-muted-foreground">Buyer</dt><dd>{order.billing_contact_name}<br />{order.billing_contact_email}</dd></div>
          <div><dt className="text-muted-foreground">Quote</dt><dd>{order.quote_number ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">PO</dt><dd>{order.po_number ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">Invoice</dt><dd>{order.invoice_number ?? "—"}</dd></div>
          <div><dt className="text-muted-foreground">Total</dt><dd>{money(order.total_cents)}</dd></div>
          <div><dt className="text-muted-foreground">Balance</dt><dd className="font-bold">{money(order.total_cents - order.paid_cents)}</dd></div>
        </dl>
        {(order.procurement_order_lines ?? []).map((line: any) => <div key={line.id} className="flex justify-between border-t pt-2 text-sm"><span>{line.quantity} × {line.description}</span><span>{money(line.total_cents)}</span></div>)}
        {order.procurement_status === "quote_requested" && <Button disabled={busy} onClick={() => void run(() => issueProcurementQuote(id), "Quote issued.")}>Issue quote</Button>}
        {order.quote_issued_at && <Button variant="outline" onClick={() => void run(async () => { const { url } = await getPdf({ data: { orderId: id, kind: "quote" } }); window.open(url, "_blank", "noopener"); }, "Quote PDF opened")}>Open quote PDF</Button>}
        {order.procurement_status === "purchase_order_received" && <Button disabled={busy} onClick={() => void run(() => approveProcurementPo(id), "PO approved. Registration still requires organizer confirmation.")}>Approve PO</Button>}
        {order.approved_at && !order.invoice_number && <Button disabled={busy} onClick={() => void run(() => issueProcurementInvoice(id), "Invoice number issued.")}>Issue invoice</Button>}
        {order.invoice_issued_at && <Button variant="outline" onClick={() => void run(async () => { const { url } = await getPdf({ data: { orderId: id, kind: "invoice" } }); window.open(url, "_blank", "noopener"); }, "Invoice PDF opened")}>Open invoice PDF</Button>}
      </CardContent></Card>
      <div className="space-y-4">
        <Card><CardContent className="space-y-3 p-6"><h3 className="font-bold">Documents</h3>
          {(order.procurement_documents ?? []).length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
          {(order.procurement_documents ?? []).map((doc: any) => <div key={doc.id} className="flex justify-between gap-2 text-sm"><span>{doc.kind.replaceAll("_", " ")} · {doc.file_name}</span><Button size="sm" variant="outline" onClick={() => void run(async () => { const result = await download({ data: { documentId: doc.id } }); window.open(result.url, "_blank", "noopener"); }, "Document opened")}>Open</Button></div>)}
        </CardContent></Card>
        <Card><CardContent className="space-y-3 p-6"><h3 className="font-bold">Covered attendees</h3><ul className="list-inside list-disc text-sm">{(order.procurement_registrants ?? []).map((r: any) => <li key={r.id}>{r.attendee_name}{r.registration_id ? " · linked to registration" : " · pending"}</li>)}</ul></CardContent></Card>
        {order.invoice_number && order.paid_cents < order.total_cents && <Card><CardContent className="space-y-3 p-6"><h3 className="font-bold">Record received payment</h3><p className="text-sm text-muted-foreground">Record only cleared funds. This does not charge a card.</p>
          <div><Label htmlFor="payment-amount">Amount received (USD)</Label><Input id="payment-amount" type="number" min="0.01" step="0.01" max={(order.total_cents - order.paid_cents) / 100} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div><Label htmlFor="payment-method">Method</Label><select id="payment-method" className="min-h-11 w-full rounded border bg-background px-3" value={method} onChange={(e) => setMethod(e.target.value)}><option value="check">Check</option><option value="ach">ACH</option><option value="square">Square</option><option value="manual">Manual</option><option value="other">Other</option></select></div>
          <div><Label htmlFor="payment-reference">Reference or check number</Label><Input id="payment-reference" value={reference} onChange={(e) => setReference(e.target.value)} /></div>
          <Button disabled={busy || !Number(amount) || Number(amount) <= 0} onClick={() => void run(() => recordProcurementPayment({ orderId: id, amountCents: Math.round(Number(amount) * 100), receivedAt: new Date().toISOString(), method, reference }), "Payment recorded")}>Record payment</Button>
        </CardContent></Card>}
        <Card><CardContent className="p-6"><h3 className="font-bold">Timeline</h3><ol className="mt-3 space-y-2 text-sm">{(order.procurement_activity_log ?? []).map((item: any) => <li key={item.id} className="border-l-2 pl-3"><strong>{item.action.replaceAll("_", " ")}</strong><span className="ml-2 text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span></li>)}</ol></CardContent></Card>
      </div>
    </div>}
  </AdminShell>;
}
