import { describe, expect, it } from "vitest";
import { mappingInput, summarizeTicketClasses } from "./ticket-mapping";
import { parseEventbriteCsv, ticketClassRows } from "./eventbrite-import";
import { normalizeApiAttendees } from "./eventbrite-api-sync";

const id = "00000000-0000-4000-8000-000000000001";

describe("Eventbrite ticket type mapping", () => {
  it("CSV import keeps the Ticket Type column", () => {
    const r = parseEventbriteCsv("Attendee #,Barcode #,Email,First Name,Last Name,Ticket Type\nA1,BARCODE1,a@x.org,A,B,General + Lunch\n");
    expect(r.ok && r.rows[0].ticket_class).toBe("General + Lunch");
    expect(r.ok && r.ignoredColumns).not.toContain("Ticket Type");
  });
  it("API sync keeps ticket_class_name", () => {
    const { rows } = normalizeApiAttendees([{ id: 7, ticket_class_name: "VIP", profile: { email: "v@x.org", name: "V" }, barcodes: [{ barcode: "BARCODE7" }] }]);
    expect(rows[0].ticket_class).toBe("VIP");
  });
  it("ticket class payload contains only attendee ID and ticket class", () => {
    const r = parseEventbriteCsv("Attendee #,Barcode #,Email,Name,Ticket Type\nA1,BARCODE1,a@x.org,Ann,VIP\nA2,BARCODE2,b@x.org,Bo,\n");
    expect(r.ok && ticketClassRows(r.rows)).toEqual([{ external_id: "A1", ticket_class: "VIP" }]);
  });
  it("mapping quantity must be 1 to 20", () => {
    const base = { eventId: id, ticketClass: "VIP", productId: id };
    expect(mappingInput.safeParse({ ...base, quantity: 0 }).success).toBe(false);
    expect(mappingInput.safeParse({ ...base, quantity: 21 }).success).toBe(false);
    expect(mappingInput.safeParse({ ...base, quantity: 2 }).success).toBe(true);
  });
  it("summaries count registered and cancelled without attendee fields", () => {
    const s = summarizeTicketClasses([
      { eventbrite_ticket_class: "VIP", status: "registered" },
      { eventbrite_ticket_class: "VIP", status: "cancelled" },
      { eventbrite_ticket_class: null, status: "registered" },
    ]);
    expect(s).toEqual([{ ticketClass: "VIP", registered: 1, cancelled: 1 }]);
  });
});
