import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { AppCard } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getProcurementOrder, money, effectivePaymentStatus } from "@/lib/procurement";
import {
  requestProcurementDocumentUpload,
  confirmProcurementDocumentUpload,
  getProcurementDocumentDownload,
} from "@/lib/procurement-documents.functions";
import { toast } from "sonner";
import { getProcurementPdf } from "@/lib/procurement-pdf.functions";

export const Route = createFileRoute("/_authenticated/account/purchases/$id")({ component: PurchaseDetail });

function PurchaseDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: order, isLoading, error } = useQuery({ queryKey: ["procurement-order", id], queryFn: () => getProcurementOrder(id), retry: false });
  const requestUpload = useServerFn(requestProcurementDocumentUpload);
  const confirmUpload = useServerFn(confirmProcurementDocumentUpload);
  const getDownload = useServerFn(getProcurementDocumentDownload);
  const getPdf = useServerFn(getProcurementPdf);
  const [poNumber, setPoNumber] = useState("");
  const [poFile, setPoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function uploadPo() {
    if (!poFile || !poNumber.trim()) return;
    if (!["application/pdf", "image/png", "image/jpeg"].includes(poFile.type) || poFile.size > 25 * 1024 * 1024) {
      toast.error("Upload a PDF, PNG, or JPEG smaller than 25 MB.");
      return;
    }
    setBusy(true);
    try {
      const input = { orderId: id, kind: "purchase_order" as const, fileName: poFile.name, fileSize: poFile.size, mimeType: poFile.type as "application/pdf" | "image/png" | "image/jpeg" };
      const signed = await requestUpload({ data: input });
      const { error: uploadError } = await supabase.storage.from("procurement-private").uploadToSignedUrl(signed.path, signed.token, poFile);
      if (uploadError) throw uploadError;
      const confirmed = await confirmUpload({ data: { ...input, path: signed.path } });
      const { error: submitError } = await (supabase as any).rpc("submit_procurement_po", { p_order_id: id, p_po_number: poNumber.trim(), p_document_id: confirmed.documentId });
      if (submitError) throw submitError;
      toast.success("Purchase order received for organizer review.");
      await qc.invalidateQueries({ queryKey: ["procurement-order", id] });
      await qc.invalidateQueries({ queryKey: ["my-procurement-orders"] });
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "Purchase order upload failed");
    } finally { setBusy(false); }
  }

  async function download(documentId: string) {
    try {
      const { url } = await getDownload({ data: { documentId } });
      window.open(url, "_blank", "noopener");
    } catch (downloadError) {
      toast.error(downloadError instanceof Error ? downloadError.message : "Document unavailable");
    }
  }

  return <PublicLayout>
    <PageHeader title="Institutional purchase" description="Quote, purchase order, invoice, and payment history." />
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <Button variant="outline" asChild><Link to="/account/purchases">All purchases</Link></Button>
      {isLoading && <p>Loading purchase…</p>}
      {error && <AppCard padding="md"><p className="text-destructive">Purchase not found or access denied.</p></AppCard>}
      {order && <>
        <AppCard padding="md" className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{order.events?.title ?? "Institutional purchase"}</h2><p>{order.institution_name}</p></div><Badge>{order.procurement_status.replaceAll("_", " ")}</Badge></div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-muted-foreground">Quote</dt><dd>{order.quote_number ?? "Pending"}</dd></div>
            <div><dt className="text-muted-foreground">PO</dt><dd>{order.po_number ?? "Not submitted"}</dd></div>
            <div><dt className="text-muted-foreground">Invoice</dt><dd>{order.invoice_number ?? "Not issued"}</dd></div>
            <div><dt className="text-muted-foreground">Total</dt><dd>{money(order.total_cents)}</dd></div>
            <div><dt className="text-muted-foreground">Paid</dt><dd>{money(order.paid_cents)}</dd></div>
            <div><dt className="text-muted-foreground">Balance</dt><dd className="font-bold">{money(order.total_cents - order.paid_cents)} · {effectivePaymentStatus(order).replaceAll("_", " ")}</dd></div>
          </dl>
          {order.due_at && <p className="text-sm">Due {new Date(order.due_at).toLocaleDateString()}</p>}
          <div className="flex flex-wrap gap-2">
            {order.quote_issued_at && <Button variant="outline" onClick={() => void getPdf({ data: { orderId: id, kind: "quote" } }).then(({ url }) => window.open(url, "_blank", "noopener")).catch(() => toast.error("Quote PDF unavailable"))}>Download quote PDF</Button>}
            {order.invoice_issued_at && <Button variant="outline" onClick={() => void getPdf({ data: { orderId: id, kind: "invoice" } }).then(({ url }) => window.open(url, "_blank", "noopener")).catch(() => toast.error("Invoice PDF unavailable"))}>Download invoice PDF</Button>}
          </div>
          <div className="border-t pt-3"><h3 className="font-bold">Items</h3><ul className="mt-2 space-y-1 text-sm">{(order.procurement_order_lines ?? []).map((line: any) => <li key={line.id} className="flex justify-between gap-2"><span>{line.quantity} × {line.description}</span><span>{money(line.total_cents)}</span></li>)}</ul></div>
          <div className="border-t pt-3"><h3 className="font-bold">Attendees</h3><ul className="mt-2 list-inside list-disc text-sm">{(order.procurement_registrants ?? []).map((r: any) => <li key={r.id}>{r.attendee_name}{r.registration_id ? " · registered" : " · pending"}</li>)}</ul></div>
        </AppCard>
        {["quote_requested", "quote_issued", "awaiting_purchase_order", "purchase_order_received"].includes(order.procurement_status) && <AppCard padding="md" className="space-y-3">
          <h3 className="text-lg font-bold">Submit purchase order</h3>
          <p className="text-sm text-muted-foreground">Enter the PO number and upload the official document. This does not process a card payment.</p>
          <div><Label htmlFor="purchase-po-number">PO number</Label><Input id="purchase-po-number" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} maxLength={120} /></div>
          <div><Label htmlFor="purchase-po-file">Official PO · PDF, PNG, or JPEG</Label><Input id="purchase-po-file" type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e) => setPoFile(e.target.files?.[0] ?? null)} /></div>
          <Button onClick={() => void uploadPo()} disabled={busy || !poFile || !poNumber.trim()}>{busy ? "Uploading…" : "Submit PO"}</Button>
        </AppCard>}
        <AppCard padding="md" className="space-y-3"><h3 className="text-lg font-bold">Documents</h3>
          {(order.procurement_documents ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No documents available yet.</p> :
            (order.procurement_documents ?? []).map((doc: any) => <div key={doc.id} className="flex items-center justify-between gap-2"><span className="text-sm">{doc.kind.replaceAll("_", " ")} · {doc.file_name}</span><Button size="sm" variant="outline" onClick={() => void download(doc.id)}>Download</Button></div>)}
        </AppCard>
        <AppCard padding="md"><h3 className="text-lg font-bold">Activity</h3><ol className="mt-3 space-y-2 text-sm">{(order.procurement_activity_log ?? []).map((item: any) => <li key={item.id} className="border-l-2 pl-3"><span className="font-semibold">{item.action.replaceAll("_", " ")}</span><span className="ml-2 text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span></li>)}</ol></AppCard>
      </>}
    </div>
  </PublicLayout>;
}
