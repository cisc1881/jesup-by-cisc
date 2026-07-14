import type { EventReportPreview } from "@/lib/event-reporting";

export function buildImpactReportContext(report: EventReportPreview): string {
  return JSON.stringify({
    events: report.events.map((event) => ({
      title: event.title,
      startsAt: event.startsAt,
      location: event.location,
      category: event.categoryName,
    })),
    attendance: {
      registrations: report.attendance.registrations,
      checkedIn: report.attendance.checkedIn,
      attended: report.attendance.attended,
      virtual: report.attendance.virtual,
      walkIns: report.attendance.walkIns,
      noShows: report.attendance.noShows,
      eligibleParticipants: report.attendance.eligibleParticipants,
    },
    evaluation: {
      completedResponses: report.evaluation.completedResponses,
      responseRate: report.evaluation.responseRate,
      averageOverallRating: report.evaluation.averageOverallRating,
      averageRelevanceRating: report.evaluation.averageRelevanceRating,
      averageKnowledgeGainedRating: report.evaluation.averageKnowledgeGainedRating,
      intendedBehaviorChangeRating: report.evaluation.intendedBehaviorChangeRating,
      interestInFuturePrograms: report.evaluation.interestInFuturePrograms,
    },
    geography: report.geography,
    institutions: report.institutions,
    programs: report.programsPartners.programs.map((program) => program.name),
    partners: report.programsPartners.partners.map((partner) => partner.name),
    publications: report.programsPartners.publications.map((publication) => publication.title),
    deliveryFormat: report.programsPartners.deliveryFormat,
    approvedGalleryImages: report.gallery.approvedImages,
  });
}
