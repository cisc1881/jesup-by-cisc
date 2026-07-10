import { QueryClient } from "@tanstack/react-query";

/** Shared React Query defaults for JESUP. */
export const QUERY_STALE_TIME = 60_000;
export const QUERY_GC_TIME = 5 * 60_000;

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME,
        gcTime: QUERY_GC_TIME,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export const HOME_PAGE_QUERY_KEY = ["home-page"] as const;
export const UNIVERSAL_SEARCH_QUERY_KEY = ["universal-search"] as const;

export function universalSearchQueryKey(query: string) {
  return [...UNIVERSAL_SEARCH_QUERY_KEY, query.trim()] as const;
}

export const ADMIN_INQUIRIES_QUERY_KEY = ["admin-inquiries"] as const;

export function adminInquiriesQueryKey(filters?: Record<string, unknown>) {
  return [...ADMIN_INQUIRIES_QUERY_KEY, filters ?? {}] as const;
}

export const MY_INQUIRIES_QUERY_KEY = ["my-inquiries"] as const;

export const ADMIN_EVENT_ATTENDANCE_QUERY_KEY = ["admin-event-attendance"] as const;
export const ADMIN_EVENT_WALK_INS_QUERY_KEY = ["admin-event-walk-ins"] as const;
export const ADMIN_EVENT_ATTENDANCE_SUMMARY_QUERY_KEY = ["admin-event-attendance-summary"] as const;

export function adminEventAttendanceQueryKey(eventId: string) {
  return [...ADMIN_EVENT_ATTENDANCE_QUERY_KEY, eventId] as const;
}

export function adminEventWalkInsQueryKey(eventId: string) {
  return [...ADMIN_EVENT_WALK_INS_QUERY_KEY, eventId] as const;
}

export function adminEventAttendanceSummaryQueryKey(eventId: string) {
  return [...ADMIN_EVENT_ATTENDANCE_SUMMARY_QUERY_KEY, eventId] as const;
}

export const EVENT_EVALUATION_QUERY_KEY = ["event-evaluation"] as const;
export const EVALUATION_QUESTIONS_QUERY_KEY = ["evaluation-questions"] as const;
export const MY_PENDING_EVALUATIONS_QUERY_KEY = ["my-pending-evaluations"] as const;
export const MY_COMPLETED_EVALUATIONS_QUERY_KEY = ["my-completed-evaluations"] as const;
export const ADMIN_EVALUATION_RESPONSES_QUERY_KEY = ["admin-evaluation-responses"] as const;
export const ADMIN_EVALUATION_SUMMARY_QUERY_KEY = ["admin-evaluation-summary"] as const;

export function eventEvaluationQueryKey(eventId: string) {
  return [...EVENT_EVALUATION_QUERY_KEY, eventId] as const;
}

export function evaluationQuestionsQueryKey(evaluationId: string) {
  return [...EVALUATION_QUESTIONS_QUERY_KEY, evaluationId] as const;
}

export function adminEvaluationResponsesQueryKey(eventId: string) {
  return [...ADMIN_EVALUATION_RESPONSES_QUERY_KEY, eventId] as const;
}

export function adminEvaluationSummaryQueryKey(eventId: string) {
  return [...ADMIN_EVALUATION_SUMMARY_QUERY_KEY, eventId] as const;
}

export const EVENT_DEMOGRAPHIC_AGGREGATES_QUERY_KEY = ["event-demographic-aggregates"] as const;
export const MULTI_EVENT_DEMOGRAPHIC_AGGREGATES_QUERY_KEY = ["multi-event-demographic-aggregates"] as const;
export const DEMOGRAPHIC_COMPLETION_QUERY_KEY = ["demographic-completion"] as const;

export function eventDemographicAggregatesQueryKey(eventId: string) {
  return [...EVENT_DEMOGRAPHIC_AGGREGATES_QUERY_KEY, eventId] as const;
}

export function multiEventDemographicAggregatesQueryKey(eventIds: string[]) {
  return [...MULTI_EVENT_DEMOGRAPHIC_AGGREGATES_QUERY_KEY, eventIds] as const;
}

export function demographicCompletionQueryKey(sourceType: string, sourceId: string) {
  return [...DEMOGRAPHIC_COMPLETION_QUERY_KEY, sourceType, sourceId] as const;
}

export const PUBLIC_EVENT_GALLERY_QUERY_KEY = ["public-event-gallery"] as const;
export const ADMIN_EVENT_GALLERY_QUERY_KEY = ["admin-event-gallery"] as const;
export const PENDING_GALLERY_SUBMISSIONS_QUERY_KEY = ["pending-gallery-submissions"] as const;
export const MY_GALLERY_SUBMISSIONS_QUERY_KEY = ["my-gallery-submissions"] as const;
export const EVENT_GALLERY_SUMMARY_QUERY_KEY = ["event-gallery-summary"] as const;
export const ADMIN_GALLERY_SUBMISSIONS_QUERY_KEY = ["admin-gallery-submissions"] as const;

export function publicEventGalleryQueryKey(eventId: string) {
  return [...PUBLIC_EVENT_GALLERY_QUERY_KEY, eventId] as const;
}

export function adminEventGalleryQueryKey(eventId: string) {
  return [...ADMIN_EVENT_GALLERY_QUERY_KEY, eventId] as const;
}

export function pendingGallerySubmissionsQueryKey(eventId?: string) {
  return [...PENDING_GALLERY_SUBMISSIONS_QUERY_KEY, eventId ?? "all"] as const;
}

export function myGallerySubmissionsQueryKey(userId: string) {
  return [...MY_GALLERY_SUBMISSIONS_QUERY_KEY, userId] as const;
}

export function eventGallerySummaryQueryKey(eventId: string) {
  return [...EVENT_GALLERY_SUMMARY_QUERY_KEY, eventId] as const;
}

export function adminGallerySubmissionsQueryKey(filters?: { eventId?: string; status?: string }) {
  return [...ADMIN_GALLERY_SUBMISSIONS_QUERY_KEY, filters ?? {}] as const;
}

export const REPORT_FILTERS_QUERY_KEY = ["report-filters"] as const;
export const EVENT_REPORT_SUMMARY_QUERY_KEY = ["event-report-summary"] as const;
export const MULTI_EVENT_REPORT_SUMMARY_QUERY_KEY = ["multi-event-report-summary"] as const;
export const REPORT_DRAFTS_QUERY_KEY = ["report-drafts"] as const;
export const REPORT_SNAPSHOT_QUERY_KEY = ["report-snapshot"] as const;

export function reportFiltersQueryKey(filters: Record<string, unknown>) {
  return [...REPORT_FILTERS_QUERY_KEY, filters] as const;
}

export function eventReportSummaryQueryKey(eventId: string) {
  return [...EVENT_REPORT_SUMMARY_QUERY_KEY, eventId] as const;
}

export function multiEventReportSummaryQueryKey(eventIds: string[]) {
  return [...MULTI_EVENT_REPORT_SUMMARY_QUERY_KEY, eventIds] as const;
}

export function reportDraftsQueryKey() {
  return [...REPORT_DRAFTS_QUERY_KEY] as const;
}

export function reportSnapshotQueryKey(id: string) {
  return [...REPORT_SNAPSHOT_QUERY_KEY, id] as const;
}
