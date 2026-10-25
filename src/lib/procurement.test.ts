import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { effectivePaymentStatus, paymentDueDate } from "./procurement";
import { renderProcurementPdf } from "./procurement-pdf.functions";

describe("institutional payment state", () => {
  const order = { invoice_number: "JESUP-INV-1", total_cents: 10000, paid_cents: 0, due_at: "2026-11-01T00:00:00Z" };
  it("handles unpaid, partial, overdue, and fully paid balances", () => {
    expect(effectivePaymentStatus(order, new Date("2026-10-31T00:00:00Z"))).toBe("unpaid");
    expect(effectivePaymentStatus({ ...order, paid_cents: 2000 }, new Date("2026-10-31T00:00:00Z"))).toBe("partially_paid");
    expect(effectivePaymentStatus({ ...order, paid_cents: 2000 }, new Date("2026-11-02T00:00:00Z"))).toBe("past_due");
    expect(effectivePaymentStatus({ ...order, paid_cents: 10000 }, new Date("2026-11-02T00:00:00Z"))).toBe("paid");
  });
  it("calculates net terms across a month boundary", () => {
    expect(paymentDueDate(new Date("2026-10-25T12:00:00Z"), "net_30").toISOString()).toBe("2026-11-24T12:00:00.000Z");
  });
});

describe("procurement PDFs", () => {
  it("renders a valid multi-page invoice from the priced order snapshot", async () => {
    const bytes = await renderProcurementPdf({
      invoice_number: "JESUP-INV-2026-00001", invoice_issued_at: "2026-10-25T00:00:00Z",
      events: { title: "135th Annual Farmers Conference" }, seller_name: "HNCH LLC", seller_address: {},
      institution_name: "Example University", department: "Extension", billing_contact_name: "Buyer",
      billing_contact_email: "buyer@example.edu", po_number: "PO-123", due_at: "2026-11-24T00:00:00Z",
      subtotal_cents: 6000, discount_cents: 0, tax_cents: 0, total_cents: 6000, paid_cents: 0,
      remit_instructions: "Mail a check to the configured remit-to address.",
      procurement_order_lines: Array.from({ length: 70 }, (_, i) => ({ quantity: 1, description: `Item ${i + 1}`, unit_price_cents: 100, total_cents: 100 })),
    }, "invoice");
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
  });
});
