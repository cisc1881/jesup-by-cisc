import { describe, expect, it } from "vitest";
import { selectHomeEventRegistration } from "./home-event-context";

const now = Date.parse("2026-11-19T18:00:00Z");
const event = (start: string, end: string | null, status = "registered") => ({
  status,
  events: { starts_at: start, ends_at: end },
});

describe("selectHomeEventRegistration", () => {
  it("prioritizes a live registration over upcoming and recently completed events", () => {
    const upcoming = event("2026-11-21T18:00:00Z", null);
    const live = event("2026-11-19T17:00:00Z", "2026-11-19T20:00:00Z");
    const past = event("2026-11-16T17:00:00Z", "2026-11-16T20:00:00Z");
    expect(selectHomeEventRegistration([upcoming, past, live], now)).toEqual({
      registration: live,
      phase: "during",
    });
  });

  it("selects the next event before a recent past event", () => {
    const past = event("2026-11-16T17:00:00Z", "2026-11-16T20:00:00Z");
    const upcoming = event("2026-11-21T18:00:00Z", null);
    expect(selectHomeEventRegistration([past, upcoming], now)?.registration).toBe(upcoming);
  });

  it("ignores cancelled and stale registrations", () => {
    const cancelled = event("2026-11-19T17:00:00Z", "2026-11-19T20:00:00Z", "cancelled");
    const stale = event("2026-09-01T17:00:00Z", "2026-09-01T20:00:00Z");
    expect(selectHomeEventRegistration([cancelled, stale], now)).toBeNull();
  });
});
