import type { EventReportSummary } from "@/lib/event-reporting";

/** Internal review format. It is not a PEARS API request or import template. */
export function buildPearsReviewPayload(input: {
  organizationId: string;
  pearsActivityId: string;
  report: EventReportSummary;
}) {
  const { organizationId, pearsActivityId, report } = input;
  if (report.eventCount !== 1 || report.events.length !== 1) {
    throw new Error("PEARS review packages require one event.");
  }
  const event = report.events[0];
  return {
    format: "jesup-pears-review-v1",
    organizationId,
    activityId: pearsActivityId,
    source: { system: "JESUP", eventId: event.id, generatedAt: report.generatedAt },
    activity: {
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location,
      deliveryFormat: report.programsPartners.deliveryFormat,
    },
    reach: {
      registrations: report.attendance.registrations,
      attended:
        report.attendance.attended + report.attendance.checkedIn + report.attendance.virtual,
      countiesServed: report.geography.countiesServed,
      statesServed: report.geography.statesServed,
    },
    evaluation: {
      responses: report.evaluation.totalResponses,
      completedResponses: report.evaluation.completedResponses,
      averageKnowledgeGainedRating: report.evaluation.averageKnowledgeGainedRating,
      intendedBehaviorChangeRating: report.evaluation.intendedBehaviorChangeRating,
    },
    notes:
      "Aggregate review data only. Confirm PEARS field mapping and reporting rules before submission.",
  };
}
