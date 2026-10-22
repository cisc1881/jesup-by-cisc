import { describe, it, expect, vi } from "vitest";
import { listEventbriteAttendees, normalizeApiAttendees, syncOneEvent, type EventbriteApiAttendee, type FetchLike, type ImportRpc } from "./eventbrite-api-sync";

const att = (id: string, email: string, barcode: string, extra: Partial<EventbriteApiAttendee> = {}): EventbriteApiAttendee =>
  ({ id, profile: { first_name: "Ada", last_name: "Lee", email }, barcodes: [{ barcode }], status: "Attending", ...extra });
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const fail = (status: number) => ({ ok: false, status, json: async () => ({}) });
const pages = (...responses: ReturnType<typeof ok>[]) => { const f = vi.fn<FetchLike>(); responses.forEach((r) => f.mockResolvedValueOnce(r)); return f; };
const noSleep = async () => {};
const event = { id: "4a1ae1f9-65ff-45ca-98cb-dd8ea2d41a18", title: "Test event", eventbriteEventId: "123" };

describe("Eventbrite API pagination", () => {
  it("follows pages until has_more_items is false", async () => {
    const f = pages(ok({ attendees: [att("1", "a@b.co", "BARCODE1")], pagination: { page_count: 2, has_more_items: true } }), ok({ attendees: [att("2", "c@d.co", "BARCODE2")], pagination: { page_count: 2, has_more_items: false } }));
    expect((await listEventbriteAttendees("123", "t", { fetch: f, sleep: noSleep })).length).toBe(2);
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("retries rate limits and server errors before succeeding", async () => {
    const f = pages(fail(429), fail(503), ok({ attendees: [], pagination: { has_more_items: false } }));
    expect(await listEventbriteAttendees("123", "t", { fetch: f, sleep: noSleep })).toEqual([]);
    expect(f).toHaveBeenCalledTimes(3);
  });
  it("does not retry auth failures", async () => {
    const f = pages(fail(401));
    await expect(listEventbriteAttendees("123", "t", { fetch: f, sleep: noSleep })).rejects.toThrow("(401) on page 1");
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("stops at the page bound", async () => {
    const f = vi.fn<FetchLike>().mockResolvedValue(ok({ attendees: [], pagination: { has_more_items: true } }));
    await expect(listEventbriteAttendees("123", "t", { fetch: f, sleep: noSleep, maxPages: 3 })).rejects.toThrow("Stopped after 3 pages");
  });
});

describe("Eventbrite API normalization", () => {
  it("flags duplicate attendee IDs and barcodes without attendee data in reasons", () => {
    const { rows, issues } = normalizeApiAttendees([att("1", "secret@b.co", "BARCODE1"), att("1", "x@b.co", "BARCODE9"), att("2", "y@b.co", "BARCODE1")]);
    expect(rows.length).toBe(1);
    expect(issues.map((i) => i.line)).toEqual([2, 3]);
    expect(JSON.stringify(issues)).not.toMatch(/secret|BARCODE/);
  });
  it("maps cancelled/refunded attendees and lowercases email", () => {
    const { rows } = normalizeApiAttendees([att("1", "A@B.CO", "BARCODE1", { cancelled: true }), att("2", "c@d.co", "BARCODE2", { refunded: true })]);
    expect(rows.map((r) => [r.email, r.status])).toEqual([["a@b.co", "cancelled"], ["c@d.co", "cancelled"]]);
  });
});

describe("Eventbrite sync uses the protected import function", () => {
  it("sends rows to the import function (never direct writes) and reports its conflicts", async () => {
    const rpc = vi.fn<ImportRpc>().mockResolvedValue({ data: { counts: { new: 0, update: 0, duplicate: 0, conflict: 2, cancelled: 0, invalid: 0 }, issues: [
      { line: 1, outcome: "conflict", reason: "Registration is claimed by an account; email/barcode changes need manual review" },
      { line: 2, outcome: "conflict", reason: "Cancellation skipped: attendee is checked in or holds issued credentials" },
    ] }, error: null });
    const f = pages(ok({ attendees: [att("1", "changed@b.co", "BARCODE1"), att("2", "c@d.co", "BARCODE2", { status: "Not Attending" })], pagination: { has_more_items: false } }));
    const report = await syncOneEvent(event, { token: "t", fetch: f, rpc, sleep: noSleep });
    expect(rpc.mock.calls[0][0]).toMatchObject({ p_event_id: event.id, p_dry_run: false });
    expect(rpc.mock.calls[0][0].p_rows[1].status).toBe("cancelled");
    expect(report.counts?.conflict).toBe(2);
  });
  it("uses the same request ID for identical retries so the database replays", async () => {
    const rpc = vi.fn<ImportRpc>().mockResolvedValue({ data: { counts: { new: 1, update: 0, duplicate: 0, conflict: 0, cancelled: 0, invalid: 0 } }, error: null });
    const body = { attendees: [att("1", "a@b.co", "BARCODE1")], pagination: { has_more_items: false } };
    await syncOneEvent(event, { token: "t", fetch: pages(ok(body)), rpc, sleep: noSleep });
    await syncOneEvent(event, { token: "t", fetch: pages(ok(body)), rpc, sleep: noSleep });
    expect(rpc.mock.calls[0][0].p_request_id).toBe(rpc.mock.calls[1][0].p_request_id);
  });
  it("imports nothing when a later page fails", async () => {
    const rpc = vi.fn<ImportRpc>();
    const f = pages(ok({ attendees: [att("1", "a@b.co", "BARCODE1")], pagination: { has_more_items: true } }), fail(500), fail(500), fail(500));
    const report = await syncOneEvent(event, { token: "t", fetch: f, rpc, sleep: noSleep });
    expect(report).toMatchObject({ ok: false, error: "Eventbrite request failed (500) on page 2; nothing was imported." });
    expect(rpc).not.toHaveBeenCalled();
  });
});
