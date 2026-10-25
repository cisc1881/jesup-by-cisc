import { createServerFn } from "@tanstack/react-start";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.object({ orderId: z.string().uuid(), kind: z.enum(["quote", "invoice"]) });

function dollars(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

export async function renderProcurementPdf(order: any, kind: "quote" | "invoice"): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([612, 792]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const dark = rgb(0.12, 0.14, 0.17);
  let y = 744;
  const line = (value: string, size = 10, strong = false) => {
    for (const chunk of value.match(/.{1,95}/g) ?? [""]) {
      if (y < 55) { page = pdf.addPage([612, 792]); y = 744; }
      page.drawText(chunk.replace(/[^\x20-\x7E]/g, " "), { x: 50, y, size, font: strong ? bold : regular, color: dark });
      y -= size + 8;
    }
  };
  line(kind === "quote" ? "JESUP INSTITUTIONAL QUOTE" : "JESUP INVOICE", 18, true);
  y -= 10;
  line(`${kind === "quote" ? "Quote" : "Invoice"} number: ${kind === "quote" ? order.quote_number : order.invoice_number}`, 11, true);
  line(`Event: ${order.events?.title ?? "Event"}`);
  line(`Issued: ${new Date(kind === "quote" ? order.quote_issued_at : order.invoice_issued_at).toLocaleDateString("en-US", { timeZone: "UTC" })}`);
  if (kind === "quote" && order.quote_expires_at) line(`Quote expires: ${new Date(order.quote_expires_at).toLocaleDateString("en-US", { timeZone: "UTC" })}`);
  if (kind === "invoice" && order.due_at) line(`Due: ${new Date(order.due_at).toLocaleDateString("en-US", { timeZone: "UTC" })}`);
  y -= 12;
  line("SELLER / PAYEE", 10, true);
  line(order.seller_name);
  if (order.seller_address && Object.keys(order.seller_address).length) line(Object.values(order.seller_address).filter(Boolean).join(", "));
  y -= 8;
  line("BILL TO", 10, true);
  line(order.institution_name);
  if (order.department) line(order.department);
  line(`${order.billing_contact_name} | ${order.billing_contact_email}`);
  if (order.po_number) line(`PO number: ${order.po_number}`);
  y -= 16;
  line("ITEMS", 10, true);
  for (const item of order.procurement_order_lines ?? []) {
    line(`${item.quantity} x ${item.description} @ ${dollars(item.unit_price_cents)}  =  ${dollars(item.total_cents)}`);
  }
  y -= 8;
  line(`Subtotal: ${dollars(order.subtotal_cents)}`, 10, true);
  if (order.discount_cents) line(`Discount: -${dollars(order.discount_cents)}`);
  if (order.tax_cents) line(`Tax: ${dollars(order.tax_cents)}`);
  line(`Total: ${dollars(order.total_cents)}`, 12, true);
  if (kind === "invoice") {
    line(`Payments received: ${dollars(order.paid_cents)}`);
    line(`Balance: ${dollars(order.total_cents - order.paid_cents)}`, 12, true);
  }
  y -= 14;
  if (order.remit_instructions) {
    line("REMITTANCE", 10, true);
    line(order.remit_instructions);
  }
  line("This document is generated from the JESUP order record. A quote is not proof of payment.", 8);
  return pdf.save();
}

export const getProcurementPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(input)
  .handler(async ({ data, context }) => {
    // RLS authorizes both the order and its line items for this caller.
    const { data: order, error } = await (context.supabase as any).from("procurement_orders")
      .select("*,events(title),procurement_order_lines(*)").eq("id", data.orderId).maybeSingle();
    if (error || !order) throw new Error("Purchase not found or unavailable.");
    if (data.kind === "quote" && !order.quote_issued_at) throw new Error("The quote has not been issued.");
    if (data.kind === "invoice" && !order.invoice_issued_at) throw new Error("The invoice has not been issued.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("procurement_documents" as any)
      .select("id,storage_path").eq("order_id", data.orderId).eq("kind", data.kind).maybeSingle();
    let path = (existing as any)?.storage_path as string | undefined;
    if (!path) {
      const bytes = await renderProcurementPdf(order, data.kind);
      path = `${data.orderId}/${data.kind}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabaseAdmin.storage.from("procurement-private")
        .upload(path, bytes, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw uploadError;
      const { error: documentError } = await supabaseAdmin.from("procurement_documents" as any).insert({
        order_id: data.orderId, kind: data.kind, storage_path: path,
        file_name: `${data.kind === "quote" ? order.quote_number : order.invoice_number}.pdf`,
        mime_type: "application/pdf", file_size: bytes.length, audience: "buyer", uploaded_by: context.userId,
      } as any);
      if (documentError) throw documentError;
    }
    const { data: signed, error: signedError } = await supabaseAdmin.storage.from("procurement-private").createSignedUrl(path, 60);
    if (signedError) throw signedError;
    return { url: signed.signedUrl };
  });
