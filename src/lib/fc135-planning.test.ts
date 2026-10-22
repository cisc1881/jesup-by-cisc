import { describe, expect, it } from "vitest";
import { fc135PlanningSessions } from "./fc135-planning";
import { eventLocalInput } from "./conference";

describe("134th-program provisional adaptation", () => {
  const sessions = fc135PlanningSessions("event");
  it("rolls Thursday to February 18, 2027 at 8:00–8:45 Chicago time", () => {
    expect(sessions[0].starts_at).toBe("2027-02-18T14:00:00.000Z");
    expect(sessions[0].ends_at).toBe("2027-02-18T14:45:00.000Z");
  });
  it("rolls Friday to February 19, 2027 without carrying the 2026 dates", () => {
    expect(sessions[12].starts_at).toBe("2027-02-19T14:00:00.000Z");
    expect(sessions.every(s => eventLocalInput(s.starts_at,"America/Chicago").startsWith("2027-02-18") || eventLocalInput(s.starts_at,"America/Chicago").startsWith("2027-02-19"))).toBe(true);
  });
  it("preserves the supplied overlapping Friday 10:15–12:00 farm-tour proposal", () => {
    const tour = sessions.find(s => s.title === "ANR farm tour planning block");
    expect(tour?.starts_at).toBe("2027-02-19T16:15:00.000Z");
    expect(tour?.ends_at).toBe("2027-02-19T18:00:00.000Z");
  });
  it("leaves every venue unassigned and does not infer the missing Session III", () => {
    expect(sessions.filter(s => s.location !== null)).toHaveLength(0);
    expect(sessions.filter(s => s.title.includes("Session III"))).toHaveLength(0);
    expect(sessions).toHaveLength(21);
  });
});