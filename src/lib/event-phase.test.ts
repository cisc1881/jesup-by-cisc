import { describe, expect, it } from "vitest";
import { eventPhase } from "./event-phase";

describe("eventPhase", () => {
  const startsAt = "2026-10-29T10:00:00Z";
  const endsAt = "2026-10-29T18:00:00Z";

  it("distinguishes preparation, live event, and follow-up", () => {
    expect(eventPhase(startsAt, endsAt, new Date("2026-10-29T09:00:00Z"))).toBe("before");
    expect(eventPhase(startsAt, endsAt, new Date("2026-10-29T12:00:00Z"))).toBe("during");
    expect(eventPhase(startsAt, endsAt, new Date("2026-10-29T19:00:00Z"))).toBe("after");
  });
});
