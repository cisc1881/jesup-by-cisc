import { describe, it, expect } from "vitest";
import { EVENTBRITE_TEMPLATE_HEADER, mapEventbriteStatus, parseEventbriteCsv } from "./eventbrite-import";

const H = EVENTBRITE_TEMPLATE_HEADER;
const row = (id: string, email: string, barcode: string, status = "Attending") => `1001,2026-10-01,Ada,Lee,${email},1,General,${id},${barcode},${status}`;

describe("Eventbrite CSV import parsing", () => {
  it("accepts the template header and normalizes email", () => {
    const r = parseEventbriteCsv(`${H}\n${row("A1", " Ada@Example.COM ", "1234567890")}`);
    expect(r.ok && r.rows[0]).toMatchObject({ external_id: "A1", email: "ada@example.com", name: "Ada Lee", barcode: "1234567890", status: "registered" });
  });
  it("rejects files missing the barcode column", () => {
    const r = parseEventbriteCsv("Attendee #,Email,First Name\nA1,a@b.co,Ada");
    expect(r.ok).toBe(false);
  });
  it("flags duplicate barcodes within a file with line numbers", () => {
    const r = parseEventbriteCsv(`${H}\n${row("A1", "a@b.co", "1234567890")}\n${row("A2", "c@d.co", "1234567890")}`);
    expect(r.ok && r.issues).toEqual([{ line: 3, outcome: "invalid", reason: "Duplicate Barcode # (also on line 2)" }]);
  });
  it("flags duplicate attendee IDs", () => {
    const r = parseEventbriteCsv(`${H}\n${row("A1", "a@b.co", "1111111111")}\n${row("A1", "c@d.co", "2222222222")}`);
    expect(r.ok && r.rows.length).toBe(1);
  });
  it("rejects invalid email and short barcodes", () => {
    const r = parseEventbriteCsv(`${H}\n${row("A1", "nope", "1234567890")}\n${row("A2", "a@b.co", "123")}`);
    expect(r.ok && r.issues.length).toBe(2);
  });
  it("maps Eventbrite cancellation statuses", () => {
    expect(mapEventbriteStatus("Not Attending")).toBe("cancelled");
    expect(mapEventbriteStatus("Refunded")).toBe("cancelled");
    expect(mapEventbriteStatus("Checked In")).toBe("registered");
  });
  it("rejects more than 5000 rows", () => {
    const body = Array.from({ length: 5001 }, (_, i) => row(`A${i}`, `u${i}@b.co`, `BC${i}000000`)).join("\n");
    expect(parseEventbriteCsv(`${H}\n${body}`).ok).toBe(false);
  });
  it("keeps quoted commas in names", () => {
    const r = parseEventbriteCsv(`Attendee #,Email,Name,Barcode #\nA1,a@b.co,"Lee, Ada",1234567890`);
    expect(r.ok && r.rows[0].name).toBe("Lee, Ada");
  });
});
