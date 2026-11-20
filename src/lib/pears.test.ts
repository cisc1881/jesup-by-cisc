import { describe, expect, it } from "vitest";
import { buildPearsReviewPayload } from "./pears";
import type { EventReportSummary } from "./event-reporting";

const report = {
  eventCount: 1,
  events: [
    {
      id: "event-1",
      title: "Farm workshop",
      startsAt: "2026-11-01T14:00:00Z",
      endsAt: null,
      location: "Macon County",
    },
  ],
  generatedAt: "2026-11-04T12:00:00Z",
  attendance: { registrations: 12, attended: 5, checkedIn: 3, virtual: 2 },
  geography: { countiesServed: 2, statesServed: 1 },
  evaluation: {
    totalResponses: 8,
    completedResponses: 7,
    averageKnowledgeGainedRating: 4,
    intendedBehaviorChangeRating: 3,
  },
  programsPartners: { deliveryFormat: "in_person" },
  participantName: "Do not export",
} as unknown as EventReportSummary;

describe("PEARS review package", () => {
  it("uses aggregate reach and omits participant details", () => {
    const payload = buildPearsReviewPayload({
      organizationId: "org-1",
      pearsActivityId: "activity-1",
      report,
    });
    expect(payload.reach.attended).toBe(10);
    expect(JSON.stringify(payload)).not.toContain("Do not export");
    expect(payload.format).toBe("jesup-pears-review-v1");
  });

  it("rejects multi-event reports", () => {
    expect(() =>
      buildPearsReviewPayload({
        organizationId: "org-1",
        pearsActivityId: "activity-1",
        report: { ...report, eventCount: 2 },
      }),
    ).toThrow();
  });
});
