import { describe, expect, it } from "vitest";
import {
  countdownParts,
  isValidContactEmail,
  isValidContactPhone,
  sanitizeSocialLinks,
  sanitizeSpeakerUrl,
  sessionCountdown,
  type CountdownSession,
} from "./speakers";

describe("sanitizeSpeakerUrl", () => {
  it("accepts https URLs and upgrades bare domains to https", () => {
    expect(sanitizeSpeakerUrl("https://example.edu/bio")).toBe("https://example.edu/bio");
    expect(sanitizeSpeakerUrl("example.edu/bio")).toBe("https://example.edu/bio");
  });

  it("rejects non-https schemes and dangerous values", () => {
    expect(sanitizeSpeakerUrl("http://example.edu")).toBeNull();
    expect(sanitizeSpeakerUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeSpeakerUrl("data:text/html,<script>")).toBeNull();
    expect(sanitizeSpeakerUrl("mailto:a@b.edu")).toBeNull();
    expect(sanitizeSpeakerUrl("ftp://files.example.edu")).toBeNull();
    expect(sanitizeSpeakerUrl("https://user:pass@example.edu")).toBeNull();
  });

  it("rejects empty and hostless values", () => {
    expect(sanitizeSpeakerUrl("")).toBeNull();
    expect(sanitizeSpeakerUrl("   ")).toBeNull();
    expect(sanitizeSpeakerUrl(null)).toBeNull();
    expect(sanitizeSpeakerUrl("localhost")).toBeNull();
  });
});

describe("contact validation", () => {
  it("validates email addresses", () => {
    expect(isValidContactEmail("speaker@tuskegee.edu")).toBe(true);
    expect(isValidContactEmail("first.last+lab@school.edu")).toBe(true);
    expect(isValidContactEmail("not-an-email")).toBe(false);
    expect(isValidContactEmail("a@b")).toBe(false);
    expect(isValidContactEmail("")).toBe(false);
  });

  it("validates phone numbers without inventing formats", () => {
    expect(isValidContactPhone("+1 (334) 727-8000")).toBe(true);
    expect(isValidContactPhone("334-727-8000")).toBe(true);
    expect(isValidContactPhone("123")).toBe(false);
    expect(isValidContactPhone("call me maybe")).toBe(false);
    expect(isValidContactPhone("+1-334-727-8000 ext 9")).toBe(false);
  });
});

describe("sanitizeSocialLinks", () => {
  it("keeps valid platform-labelled links and drops invalid ones", () => {
    const links = sanitizeSocialLinks([
      { platform: "linkedin", url: "linkedin.com/in/speaker" },
      { platform: "x", url: "javascript:alert(1)" },
      { platform: "myspace", url: "https://myspace.com/x" },
      { platform: "youtube", url: "https://youtube.com/@speaker" },
    ]);
    expect(links).toEqual([
      { platform: "linkedin", label: "LinkedIn", url: "https://linkedin.com/in/speaker" },
      { platform: "youtube", label: "YouTube", url: "https://youtube.com/@speaker" },
    ]);
  });

  it("returns an empty array for missing or non-array input", () => {
    expect(sanitizeSocialLinks(null)).toEqual([]);
    expect(sanitizeSocialLinks(undefined)).toEqual([]);
  });
});

const session = (
  id: string,
  startsAt: string | null,
  endsAt: string | null = null,
): CountdownSession => ({ id, title: `Session ${id}`, startsAt, endsAt });

describe("sessionCountdown", () => {
  // FC135-style conference: Feb 18–19 2027, America/Chicago (UTC-6).
  const day1morning = "2027-02-18T15:00:00Z"; // 9:00 AM CT
  const day1lunch = "2027-02-18T18:00:00Z"; // 12:00 PM CT
  const day2 = "2027-02-19T15:00:00Z";

  it("returns none when no sessions have times", () => {
    expect(sessionCountdown([session("a", null)]).kind).toBe("none");
    expect(sessionCountdown([]).kind).toBe("none");
  });

  it("targets the next future session before the event", () => {
    const now = new Date("2027-02-01T12:00:00Z");
    const result = sessionCountdown([session("a", day1morning, day1lunch), session("b", day2)], now);
    expect(result.kind).toBe("upcoming");
    if (result.kind === "upcoming") {
      expect(result.startsAt.toISOString()).toBe(day1morning);
      expect(result.sessions.map((s) => s.id)).toEqual(["a"]);
    }
  });

  it("groups simultaneous sessions into one countdown", () => {
    const now = new Date("2027-02-18T14:00:00Z");
    const result = sessionCountdown(
      [session("main", day1morning, day1lunch), session("track-b", day1morning, day1lunch), session("later", day1lunch)],
      now,
    );
    expect(result.kind).toBe("upcoming");
    if (result.kind === "upcoming") {
      expect(result.sessions.map((s) => s.id).sort()).toEqual(["main", "track-b"]);
    }
  });

  it("reports current sessions while they are running", () => {
    const now = new Date("2027-02-18T16:00:00Z"); // 10 AM CT, inside 9–12 session
    const result = sessionCountdown([session("a", day1morning, day1lunch), session("b", day2)], now);
    expect(result.kind).toBe("now");
    if (result.kind === "now") expect(result.sessions.map((s) => s.id)).toEqual(["a"]);
  });

  it("moves to the next session once the current one ends", () => {
    const now = new Date("2027-02-18T18:30:00Z"); // after lunch start
    const result = sessionCountdown([session("a", day1morning, day1lunch), session("b", day2)], now);
    expect(result.kind).toBe("upcoming");
    if (result.kind === "upcoming") expect(result.startsAt.toISOString()).toBe(day2);
  });

  it("returns after once every session has ended", () => {
    const now = new Date("2027-02-20T00:00:00Z");
    expect(sessionCountdown([session("a", day1morning, day1lunch), session("b", day2)], now).kind).toBe("after");
  });

  it("treats a session without an end time as current for a bounded window only", () => {
    const start = "2027-02-18T15:00:00Z";
    const during = sessionCountdown([session("a", start)], new Date("2027-02-18T17:00:00Z"));
    expect(during.kind).toBe("now");
    const longAfter = sessionCountdown([session("a", start)], new Date("2027-02-18T23:00:00Z"));
    expect(longAfter.kind).toBe("after");
  });

  it("is timezone-safe: absolute instants drive the state, not local wall time", () => {
    // 8:59 AM CT (14:59 UTC) is before the 9 AM CT session; 9:01 AM CT is inside it.
    const before = sessionCountdown([session("a", day1morning, day1lunch)], new Date("2027-02-18T14:59:00Z"));
    expect(before.kind).toBe("upcoming");
    const inside = sessionCountdown([session("a", day1morning, day1lunch)], new Date("2027-02-18T15:01:00Z"));
    expect(inside.kind).toBe("now");
  });
});

describe("countdownParts", () => {
  it("breaks the remaining time into days, hours, minutes, seconds", () => {
    const target = new Date("2027-02-18T15:00:00Z");
    const now = new Date(target.getTime() - (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000);
    expect(countdownParts(target, now)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 });
  });

  it("never goes negative after the target passes", () => {
    const target = new Date("2027-02-18T15:00:00Z");
    expect(countdownParts(target, new Date("2027-02-19T00:00:00Z"))).toEqual({
      days: 0, hours: 0, minutes: 0, seconds: 0,
    });
  });
});
