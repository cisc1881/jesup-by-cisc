import { supabase } from "@/integrations/supabase/client";
import {
  computeAttendanceRate,
  exportAttendanceCsv,
  getAttendanceSummary,
  listEventAttendance,
  type AttendanceSummary,
  type EventAttendanceRow,
} from "@/lib/attendance";
import { downloadCsv, toCsv, type CsvColumn } from "@/lib/csv";
import {
  DEMOGRAPHIC_CATEGORY_LABELS,
  formatDemographicLabel,
  getEventDemographicAggregates,
  getMultiEventDemographicAggregates,
  type DemographicAggregateRow,
} from "@/lib/demographics";
import {
  getEventGallerySummary,
  listApprovedEventGallery,
  type EventGalleryItem,
} from "@/lib/event-gallery";
import {
  exportEvaluationResponsesCsv,
  getEvaluationSummary,
  listAdminEvaluationResponses,
  type EvaluationSummary,
} from "@/lib/evaluations";
import { fetchAdminEvents, type EventAdminRow } from "@/lib/events";

export type ReportFilters = {
  eventIds: string[];
  programId?: string;
  categoryId?: string;
  county?: string;
  institutionId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type ReportNarrativeFields = {
  reportTitle: string;
  eventPurpose: string;
  programGoals: string;
  outcomesImpactNotes: string;
  recommendations: string;
  followUpActions: string;
  additionalComments: string;
  selectedParticipantQuotes: string;
  preparedBy: string;
  reportDate: string;
};

export type ReportStatus = "draft" | "final";

export type EventReportSnapshot = {
  id: string;
  eventId: string | null;
  eventIds: string[];
  title: string;
  filters: ReportFilters;
  narrativeFields: ReportNarrativeFields;
  metricsSnapshot: EventReportPreview | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string | null;
  status: ReportStatus;
};

export type AttendanceReportMetrics = AttendanceSummary & {
  registrations: number;
  eligibleParticipants: number;
  /** True when multi-event; counts may include duplicate people across events. */
  isRegistrationBasedCount: boolean;
  uniqueParticipantNote: string;
};

export type EvaluationReportMetrics = {
  totalResponses: number;
  completedResponses: number;
  responseRate: number;
  averageOverallRating: number | null;
  averageRelevanceRating: number | null;
  averageKnowledgeGainedRating: number | null;
  intendedBehaviorChangeRating: number | null;
  interestInFuturePrograms: { yes: number; maybe: number; no: number; total: number };
  openTextSamples: string[];
};

export type DemographicReportMetrics = {
  rows: DemographicAggregateRow[];
  isMultiEvent: boolean;
};

export type InstitutionReportMetrics = {
  institutionsRepresented: number;
  landGrant1890Represented: number;
  institutionFilterApplied: boolean;
};

export type GeographyReportMetrics = {
  countiesServed: number;
  statesServed: number;
  counties: string[];
  states: string[];
};

export type GalleryReportMetrics = {
  approvedImages: number;
  totalImages: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
  approvedItems: EventGalleryItem[];
};

export type ProgramPartnerReportMetrics = {
  programs: { id: string; name: string }[];
  partners: { id: string; name: string }[];
  publications: { id: string; title: string }[];
  eventCategory: string | null;
  deliveryFormat: string | null;
};

export type EventReportSummary = {
  eventIds: string[];
  eventCount: number;
  isMultiEvent: boolean;
  events: EventOverview[];
  attendance: AttendanceReportMetrics;
  evaluation: EvaluationReportMetrics;
  demographics: DemographicReportMetrics;
  institutions: InstitutionReportMetrics;
  geography: GeographyReportMetrics;
  gallery: GalleryReportMetrics;
  programsPartners: ProgramPartnerReportMetrics;
  generatedAt: string;
};

export type EventOverview = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  categoryName: string | null;
  status: string;
};

export type EventReportPreview = EventReportSummary & {
  narrativeFields: ReportNarrativeFields;
  snapshotId?: string;
  snapshotStatus?: ReportStatus;
  isFrozenSnapshot: boolean;
};

export type ParticipantReportRow = {
  eventTitle: string;
  participantName: string;
  email: string;
  organizationOrSchool: string;
  county: string;
  state: string;
  institution: string;
  registrationStatus: string;
  attendanceStatus: string;
  attendanceMethod: string;
  evaluationCompleted: string;
  walkIn: string;
};

export const EMPTY_NARRATIVE_FIELDS: ReportNarrativeFields = {
  reportTitle: "",
  eventPurpose: "",
  programGoals: "",
  outcomesImpactNotes: "",
  recommendations: "",
  followUpActions: "",
  additionalComments: "",
  selectedParticipantQuotes: "",
  preparedBy: "",
  reportDate: new Date().toISOString().slice(0, 10),
};

const RATING_PROMPT_MATCHERS = {
  overall: /overall event rating/i,
  relevance: /relevance of information/i,
  knowledge: /knowledge gained/i,
  behaviorChange: /likelihood of applying/i,
  futurePrograms: /interest in future programs/i,
} as const;

const MULTI_EVENT_UNIQUE_NOTE =
  "Multi-event totals count registrations and attendance records. Unique participants are estimated only when email is available; walk-ins and anonymous records are not deduplicated.";

const SNAPSHOTS_TABLE = "event_report_snapshots";

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

function uniqueStrings(values: (string | null | undefined)[]) {
  return [...new Set(values.map((v) => v?.trim()).filter((v): v is string => !!v))];
}

function averageFromQuestionSummary(
  summary: EvaluationSummary,
  matcher: RegExp,
): number | null {
  const question = summary.questionSummaries.find((q) => matcher.test(q.prompt));
  return question?.averageRating ?? null;
}

function choiceCountsFromSummary(summary: EvaluationSummary, matcher: RegExp) {
  const question = summary.questionSummaries.find((q) => matcher.test(q.prompt));
  const counts = question?.choiceCounts ?? {};
  return {
    yes: counts.Yes ?? counts.yes ?? 0,
    maybe: counts.Maybe ?? counts.maybe ?? 0,
    no: counts.No ?? counts.no ?? 0,
    total: question?.responseCount ?? 0,
  };
}

export async function resolveReportEventIds(filters: ReportFilters): Promise<string[]> {
  if (filters.eventIds.length > 0) return filters.eventIds;

  const events = await fetchAdminEvents();
  let filtered = events;

  if (filters.dateFrom) {
    filtered = filtered.filter((e) => e.startsAt >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    filtered = filtered.filter((e) => e.startsAt <= filters.dateTo!);
  }
  if (filters.categoryId) {
    filtered = filtered.filter((e) => e.categoryId === filters.categoryId);
  }

  if (filters.programId) {
    const { data, error } = await supabase
      .from("program_events")
      .select("event_id")
      .eq("program_id", filters.programId);
    if (error) throw error;
    const programEventIds = new Set((data ?? []).map((r) => r.event_id as string));
    filtered = filtered.filter((e) => programEventIds.has(e.id));
  }

  if (filters.county || filters.institutionId) {
    const eventIdSet = new Set<string>();
    for (const event of filtered) {
      const rows = await listEventAttendance(event.id);
      const countyMatch = !filters.county || rows.some((r) => r.county?.toLowerCase() === filters.county!.toLowerCase());
      if (!countyMatch) continue;
      if (filters.institutionId) {
        const demographics = await getEventDemographicAggregates(event.id);
        const hasInstitution = demographics.some(
          (d) => d.category === "institution_type" && !d.suppressed,
        );
        if (!hasInstitution) continue;
      }
      eventIdSet.add(event.id);
    }
    filtered = filtered.filter((e) => eventIdSet.has(e.id));
  }

  return filtered.map((e) => e.id);
}

async function fetchEventOverviews(eventIds: string[]): Promise<EventOverview[]> {
  if (eventIds.length === 0) return [];
  const { data, error } = await supabase
    .from("events")
    .select("id, title, starts_at, ends_at, location, status, event_categories ( name )")
    .in("id", eventIds)
    .order("starts_at");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location,
    categoryName: (row.event_categories as { name: string } | null)?.name ?? null,
    status: row.status,
  }));
}

export async function getEventAttendanceMetrics(
  eventIds: string[],
  options?: { county?: string; institutionId?: string },
): Promise<AttendanceReportMetrics> {
  const isMulti = eventIds.length > 1;
  let allRows: EventAttendanceRow[] = [];

  for (const eventId of eventIds) {
    const rows = await listEventAttendance(eventId);
    allRows = allRows.concat(rows);
  }

  if (options?.county) {
    allRows = allRows.filter((r) => r.county?.toLowerCase() === options.county!.toLowerCase());
  }

  const summary: Omit<AttendanceSummary, "attendanceRate"> = {
    totalRegistered: allRows.filter((r) => !r.isWalkIn).length,
    checkedIn: allRows.filter((r) => r.status === "checked_in").length,
    attended: allRows.filter((r) => r.status === "attended").length,
    virtual: allRows.filter((r) => r.status === "virtual").length,
    walkIns: allRows.filter((r) => r.isWalkIn).length,
    noShows: allRows.filter((r) => r.status === "no_show").length,
    cancelled: allRows.filter((r) => r.status === "cancelled").length,
  };

  const eligibleParticipants = Math.max(0, summary.totalRegistered - summary.cancelled) + summary.walkIns;

  return {
    ...summary,
    registrations: summary.totalRegistered,
    eligibleParticipants,
    attendanceRate: computeAttendanceRate(summary),
    isRegistrationBasedCount: isMulti,
    uniqueParticipantNote: isMulti ? MULTI_EVENT_UNIQUE_NOTE : "Single-event counts reflect attendance records for this event.",
  };
}

export async function getEventEvaluationMetrics(eventIds: string[]): Promise<EvaluationReportMetrics> {
  if (eventIds.length === 0) {
    return {
      totalResponses: 0,
      completedResponses: 0,
      responseRate: 0,
      averageOverallRating: null,
      averageRelevanceRating: null,
      averageKnowledgeGainedRating: null,
      intendedBehaviorChangeRating: null,
      interestInFuturePrograms: { yes: 0, maybe: 0, no: 0, total: 0 },
      openTextSamples: [],
    };
  }

  if (eventIds.length === 1) {
    const summary = await getEvaluationSummary(eventIds[0]);
    const responses = await listAdminEvaluationResponses(eventIds[0]);
    const openTextSamples = responses
      .filter((r) => r.questionType === "long_text" || r.questionType === "short_text")
      .map((r) => r.answerText)
      .filter(Boolean)
      .slice(0, 10);

    return {
      totalResponses: summary.totalResponses,
      completedResponses: summary.completedResponses,
      responseRate: summary.responseRate,
      averageOverallRating: averageFromQuestionSummary(summary, RATING_PROMPT_MATCHERS.overall) ?? summary.averageRating,
      averageRelevanceRating: averageFromQuestionSummary(summary, RATING_PROMPT_MATCHERS.relevance),
      averageKnowledgeGainedRating: averageFromQuestionSummary(summary, RATING_PROMPT_MATCHERS.knowledge),
      intendedBehaviorChangeRating: averageFromQuestionSummary(summary, RATING_PROMPT_MATCHERS.behaviorChange),
      interestInFuturePrograms: choiceCountsFromSummary(summary, RATING_PROMPT_MATCHERS.futurePrograms),
      openTextSamples,
    };
  }

  let totalResponses = 0;
  let completedResponses = 0;
  let ratingWeightedSum = 0;
  let ratingWeightedCount = 0;
  let relevanceSum = 0;
  let relevanceCount = 0;
  let knowledgeSum = 0;
  let knowledgeCount = 0;
  let behaviorSum = 0;
  let behaviorCount = 0;
  const future = { yes: 0, maybe: 0, no: 0, total: 0 };
  const openTextSamples: string[] = [];

  for (const eventId of eventIds) {
    const summary = await getEvaluationSummary(eventId);
    totalResponses += summary.totalResponses;
    completedResponses += summary.completedResponses;

    const overall = averageFromQuestionSummary(summary, RATING_PROMPT_MATCHERS.overall) ?? summary.averageRating;
    if (overall != null && summary.completedResponses > 0) {
      ratingWeightedSum += overall * summary.completedResponses;
      ratingWeightedCount += summary.completedResponses;
    }

    const relevance = averageFromQuestionSummary(summary, RATING_PROMPT_MATCHERS.relevance);
    if (relevance != null && summary.completedResponses > 0) {
      relevanceSum += relevance * summary.completedResponses;
      relevanceCount += summary.completedResponses;
    }

    const knowledge = averageFromQuestionSummary(summary, RATING_PROMPT_MATCHERS.knowledge);
    if (knowledge != null && summary.completedResponses > 0) {
      knowledgeSum += knowledge * summary.completedResponses;
      knowledgeCount += summary.completedResponses;
    }

    const behavior = averageFromQuestionSummary(summary, RATING_PROMPT_MATCHERS.behaviorChange);
    if (behavior != null && summary.completedResponses > 0) {
      behaviorSum += behavior * summary.completedResponses;
      behaviorCount += summary.completedResponses;
    }

    const eventFuture = choiceCountsFromSummary(summary, RATING_PROMPT_MATCHERS.futurePrograms);
    future.yes += eventFuture.yes;
    future.maybe += eventFuture.maybe;
    future.no += eventFuture.no;
    future.total += eventFuture.total;

    const responses = await listAdminEvaluationResponses(eventId);
    for (const row of responses) {
      if ((row.questionType === "long_text" || row.questionType === "short_text") && row.answerText) {
        openTextSamples.push(row.answerText);
      }
    }
  }

  const attendance = await getEventAttendanceMetrics(eventIds);
  const responseRate =
    attendance.eligibleParticipants > 0
      ? Math.round((completedResponses / attendance.eligibleParticipants) * 1000) / 10
      : 0;

  return {
    totalResponses,
    completedResponses,
    responseRate,
    averageOverallRating: ratingWeightedCount > 0 ? Math.round((ratingWeightedSum / ratingWeightedCount) * 10) / 10 : null,
    averageRelevanceRating: relevanceCount > 0 ? Math.round((relevanceSum / relevanceCount) * 10) / 10 : null,
    averageKnowledgeGainedRating: knowledgeCount > 0 ? Math.round((knowledgeSum / knowledgeCount) * 10) / 10 : null,
    intendedBehaviorChangeRating: behaviorCount > 0 ? Math.round((behaviorSum / behaviorCount) * 10) / 10 : null,
    interestInFuturePrograms: future,
    openTextSamples: openTextSamples.slice(0, 10),
  };
}

export async function getEventDemographicMetrics(
  eventIds: string[],
): Promise<DemographicReportMetrics> {
  if (eventIds.length === 0) return { rows: [], isMultiEvent: false };
  const rows =
    eventIds.length === 1
      ? await getEventDemographicAggregates(eventIds[0])
      : await getMultiEventDemographicAggregates(eventIds);
  return { rows, isMultiEvent: eventIds.length > 1 };
}

export async function getEventInstitutionMetrics(
  eventIds: string[],
  options?: { institutionId?: string },
): Promise<InstitutionReportMetrics> {
  const orgs = new Set<string>();
  let landGrant1890 = 0;

  for (const eventId of eventIds) {
    const demographics = await getEventDemographicAggregates(eventId);
    for (const row of demographics) {
      if (row.category === "institution_type" && !row.suppressed && row.count) {
        orgs.add(row.valueLabel);
        if (row.valueLabel === "land_grant_1890") landGrant1890 += row.count;
      }
    }

    const rows = await listEventAttendance(eventId);
    for (const row of rows) {
      if (row.organizationOrSchool?.trim()) orgs.add(row.organizationOrSchool.trim().toLowerCase());
    }
  }

  return {
    institutionsRepresented: orgs.size,
    landGrant1890Represented: landGrant1890,
    institutionFilterApplied: !!options?.institutionId,
  };
}

export async function getEventGeographyMetrics(
  eventIds: string[],
  options?: { county?: string },
): Promise<GeographyReportMetrics> {
  let allRows: EventAttendanceRow[] = [];
  for (const eventId of eventIds) {
    allRows = allRows.concat(await listEventAttendance(eventId));
  }
  if (options?.county) {
    allRows = allRows.filter((r) => r.county?.toLowerCase() === options.county!.toLowerCase());
  }
  const counties = uniqueStrings(allRows.map((r) => r.county));
  const states = uniqueStrings(allRows.map((r) => r.state));
  return {
    countiesServed: counties.length,
    statesServed: states.length,
    counties,
    states,
  };
}

export async function getEventGalleryMetrics(eventIds: string[]): Promise<GalleryReportMetrics> {
  let approvedImages = 0;
  let totalImages = 0;
  let pendingSubmissions = 0;
  let rejectedSubmissions = 0;
  const approvedItems: EventGalleryItem[] = [];

  for (const eventId of eventIds) {
    const summary = await getEventGallerySummary(eventId);
    approvedImages += summary.approvedImages;
    totalImages += summary.totalImages;
    pendingSubmissions += summary.pendingSubmissions;
    rejectedSubmissions += summary.rejectedSubmissions;
    approvedItems.push(...(await listApprovedEventGallery(eventId)));
  }

  return { approvedImages, totalImages, pendingSubmissions, rejectedSubmissions, approvedItems };
}

export async function getEventProgramPartnerMetrics(eventIds: string[]): Promise<ProgramPartnerReportMetrics> {
  if (eventIds.length === 0) {
    return { programs: [], partners: [], publications: [], eventCategory: null, deliveryFormat: null };
  }

  const [programsRes, partnersRes, publicationsRes, eventRes] = await Promise.all([
    supabase
      .from("program_events")
      .select("programs ( id, name )")
      .in("event_id", eventIds),
    supabase
      .from("event_partners")
      .select("partners ( id, name )")
      .in("event_id", eventIds),
    supabase
      .from("publication_events")
      .select("publications ( id, title )")
      .in("event_id", eventIds),
    supabase
      .from("events")
      .select("metadata, event_categories ( name )")
      .in("id", eventIds)
      .limit(1)
      .maybeSingle(),
  ]);

  if (programsRes.error) throw programsRes.error;
  if (partnersRes.error) throw partnersRes.error;
  if (publicationsRes.error) throw publicationsRes.error;
  if (eventRes.error) throw eventRes.error;

  const programMap = new Map<string, string>();
  for (const row of programsRes.data ?? []) {
    const p = row.programs as { id: string; name: string };
    programMap.set(p.id, p.name);
  }
  const partnerMap = new Map<string, string>();
  for (const row of partnersRes.data ?? []) {
    const p = row.partners as { id: string; name: string };
    partnerMap.set(p.id, p.name);
  }
  const publicationMap = new Map<string, string>();
  for (const row of publicationsRes.data ?? []) {
    const p = row.publications as { id: string; title: string };
    publicationMap.set(p.id, p.title);
  }

  const metadata = (eventRes.data?.metadata as Record<string, unknown>) ?? {};
  const deliveryFormat =
    typeof metadata.delivery_format === "string"
      ? metadata.delivery_format
      : typeof metadata.format === "string"
        ? metadata.format
        : null;

  return {
    programs: [...programMap.entries()].map(([id, name]) => ({ id, name })),
    partners: [...partnerMap.entries()].map(([id, name]) => ({ id, name })),
    publications: [...publicationMap.entries()].map(([id, title]) => ({ id, title })),
    eventCategory: (eventRes.data?.event_categories as { name: string } | null)?.name ?? null,
    deliveryFormat,
  };
}

export async function getEventReportSummary(
  eventId: string,
  options?: { county?: string; institutionId?: string },
): Promise<EventReportSummary> {
  return getMultiEventReportSummary([eventId], options);
}

export async function getMultiEventReportSummary(
  eventIds: string[],
  options?: { county?: string; institutionId?: string },
): Promise<EventReportSummary> {
  const uniqueIds = [...new Set(eventIds)];
  const [events, attendance, evaluation, demographics, institutions, geography, gallery, programsPartners] =
    await Promise.all([
      fetchEventOverviews(uniqueIds),
      getEventAttendanceMetrics(uniqueIds, options),
      getEventEvaluationMetrics(uniqueIds),
      getEventDemographicMetrics(uniqueIds),
      getEventInstitutionMetrics(uniqueIds, options),
      getEventGeographyMetrics(uniqueIds, options),
      getEventGalleryMetrics(uniqueIds),
      getEventProgramPartnerMetrics(uniqueIds),
    ]);

  return {
    eventIds: uniqueIds,
    eventCount: uniqueIds.length,
    isMultiEvent: uniqueIds.length > 1,
    events,
    attendance,
    evaluation,
    demographics,
    institutions,
    geography,
    gallery,
    programsPartners,
    generatedAt: new Date().toISOString(),
  };
}

export async function buildEventReportPreview(
  filters: ReportFilters,
  narrativeFields?: Partial<ReportNarrativeFields>,
  snapshot?: Pick<EventReportSnapshot, "metricsSnapshot" | "status" | "id">,
): Promise<EventReportPreview> {
  if (snapshot?.metricsSnapshot && snapshot.status === "final") {
    return {
      ...snapshot.metricsSnapshot,
      narrativeFields: { ...EMPTY_NARRATIVE_FIELDS, ...narrativeFields },
      snapshotId: snapshot.id,
      snapshotStatus: snapshot.status,
      isFrozenSnapshot: true,
    };
  }

  const eventIds = await resolveReportEventIds(filters);
  const summary = await getMultiEventReportSummary(eventIds, {
    county: filters.county,
    institutionId: filters.institutionId,
  });

  const defaultTitle =
    summary.eventCount === 1
      ? `${summary.events[0]?.title ?? "Event"} Report`
      : `Multi-Event Report (${summary.eventCount} events)`;

  return {
    ...summary,
    narrativeFields: {
      ...EMPTY_NARRATIVE_FIELDS,
      reportTitle: narrativeFields?.reportTitle || defaultTitle,
      ...narrativeFields,
    },
    snapshotId: snapshot?.id,
    snapshotStatus: snapshot?.status,
    isFrozenSnapshot: false,
  };
}

export async function buildParticipantReportRows(eventIds: string[]): Promise<ParticipantReportRow[]> {
  const overviews = await fetchEventOverviews(eventIds);
  const titleMap = new Map(overviews.map((e) => [e.id, e.title]));
  const rows: ParticipantReportRow[] = [];

  for (const eventId of eventIds) {
    const attendance = await listEventAttendance(eventId);
    for (const row of attendance) {
      rows.push({
        eventTitle: titleMap.get(eventId) ?? "Event",
        participantName: row.participantName,
        email: row.email ?? "",
        organizationOrSchool: row.organizationOrSchool ?? "",
        county: row.county ?? "",
        state: row.state ?? "",
        institution: row.organizationOrSchool ?? "",
        registrationStatus: row.registrationStatus ?? "",
        attendanceStatus: row.status,
        attendanceMethod: row.attendanceMethod ?? "",
        evaluationCompleted: row.evaluationCompletedAt ? "yes" : "no",
        walkIn: row.isWalkIn ? "yes" : "no",
      });
    }
  }

  return rows;
}

const SUMMARY_EXPORT_COLUMNS: CsvColumn<{
  eventTitle: string;
  eventDate: string;
  registrations: number | string;
  attended: number;
  evaluationResponses: number;
  counties: number;
  states: number;
  institutions: number;
}>[] = [
  { header: "event", get: (r) => r.eventTitle },
  { header: "date", get: (r) => r.eventDate },
  { header: "registrations", get: (r) => r.registrations },
  { header: "attended", get: (r) => r.attended },
  { header: "evaluation_responses", get: (r) => r.evaluationResponses },
  { header: "counties_served", get: (r) => r.counties },
  { header: "states_served", get: (r) => r.states },
  { header: "institutions_represented", get: (r) => r.institutions },
];

export function exportEventSummaryCsv(summary: EventReportSummary) {
  const rows = summary.events.map((event) => ({
    eventTitle: event.title,
    eventDate: event.startsAt,
    registrations: summary.isMultiEvent ? "—" : summary.attendance.registrations,
    attended: summary.attendance.attended + summary.attendance.checkedIn + summary.attendance.virtual,
    evaluationResponses: summary.evaluation.completedResponses,
    counties: summary.geography.countiesServed,
    states: summary.geography.statesServed,
    institutions: summary.institutions.institutionsRepresented,
  }));
  return toCsv(rows, SUMMARY_EXPORT_COLUMNS);
}

const PARTICIPANT_EXPORT_COLUMNS: CsvColumn<ParticipantReportRow>[] = [
  { header: "event", get: (r) => r.eventTitle },
  { header: "participant_name", get: (r) => r.participantName },
  { header: "email", get: (r) => r.email },
  { header: "organization_or_school", get: (r) => r.organizationOrSchool },
  { header: "county", get: (r) => r.county },
  { header: "state", get: (r) => r.state },
  { header: "institution", get: (r) => r.institution },
  { header: "registration_status", get: (r) => r.registrationStatus },
  { header: "attendance_status", get: (r) => r.attendanceStatus },
  { header: "attendance_method", get: (r) => r.attendanceMethod },
  { header: "evaluation_completed", get: (r) => r.evaluationCompleted },
  { header: "walk_in", get: (r) => r.walkIn },
];

export function exportEventParticipantsCsv(rows: ParticipantReportRow[]) {
  return toCsv(rows, PARTICIPANT_EXPORT_COLUMNS);
}

export async function exportEventAttendanceCsvForEvents(eventIds: string[]) {
  const allRows: EventAttendanceRow[] = [];
  for (const eventId of eventIds) {
    allRows.push(...(await listEventAttendance(eventId)));
  }
  return exportAttendanceCsv(allRows);
}

export async function exportEventEvaluationCsv(eventIds: string[]) {
  const allRows = [];
  for (const eventId of eventIds) {
    allRows.push(...(await listAdminEvaluationResponses(eventId)));
  }
  return exportEvaluationResponsesCsv(allRows);
}

const DEMOGRAPHIC_EXPORT_COLUMNS: CsvColumn<DemographicAggregateRow & { categoryLabel: string; displayLabel: string }>[] = [
  { header: "category", get: (r) => r.categoryLabel },
  { header: "label", get: (r) => r.displayLabel },
  {
    header: "count",
    get: (r) => (r.suppressed ? "Fewer than 5" : r.count),
  },
  { header: "suppressed", get: (r) => (r.suppressed ? "yes" : "no") },
];

export function exportEventDemographicAggregatesCsv(rows: DemographicAggregateRow[]) {
  const exportRows = rows.map((row) => ({
    ...row,
    categoryLabel: DEMOGRAPHIC_CATEGORY_LABELS[row.category] ?? row.category,
    displayLabel: formatDemographicLabel(row.category, row.valueLabel),
  }));
  return toCsv(exportRows, DEMOGRAPHIC_EXPORT_COLUMNS);
}

const GALLERY_EXPORT_COLUMNS: CsvColumn<{
  eventTitle: string;
  imageUrl: string;
  caption: string;
  altText: string;
  source: string;
  releaseStatus: string;
  approved: string;
  cover: string;
}>[] = [
  { header: "event", get: (r) => r.eventTitle },
  { header: "image_url", get: (r) => r.imageUrl },
  { header: "caption", get: (r) => r.caption },
  { header: "alt_text", get: (r) => r.altText },
  { header: "photographer_or_source", get: (r) => r.source },
  { header: "photo_release_status", get: (r) => r.releaseStatus },
  { header: "approved", get: (r) => r.approved },
  { header: "cover", get: (r) => r.cover },
];

export async function exportEventGalleryListCsv(eventIds: string[]) {
  const overviews = await fetchEventOverviews(eventIds);
  const titleMap = new Map(overviews.map((e) => [e.id, e.title]));
  const rows = [];

  for (const eventId of eventIds) {
    const items = await listApprovedEventGallery(eventId);
    for (const item of items) {
      rows.push({
        eventTitle: titleMap.get(eventId) ?? "Event",
        imageUrl: item.imageUrl,
        caption: item.caption ?? "",
        altText: item.altText ?? "",
        source: item.photographerOrSource ?? item.source,
        releaseStatus: item.photoReleaseStatus ?? "",
        approved: item.isPublicApproved ? "yes" : "no",
        cover: item.isCover ? "yes" : "no",
      });
    }
  }

  return toCsv(rows, GALLERY_EXPORT_COLUMNS);
}

export function printEventReport() {
  window.print();
}

export function downloadReportCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadAllReportExports(summary: EventReportPreview) {
  const eventIds = summary.eventIds;
  downloadReportCsv("event-report-summary", exportEventSummaryCsv(summary));
  const participants = await buildParticipantReportRows(eventIds);
  downloadReportCsv("event-report-participants", exportEventParticipantsCsv(participants));
  downloadReportCsv("event-report-attendance", await exportEventAttendanceCsvForEvents(eventIds));
  downloadReportCsv("event-report-evaluations", await exportEventEvaluationCsv(eventIds));
  downloadReportCsv(
    "event-report-demographics",
    exportEventDemographicAggregatesCsv(summary.demographics.rows),
  );
  downloadReportCsv("event-report-gallery", await exportEventGalleryListCsv(eventIds));
}

function mapSnapshotRow(row: Record<string, unknown>): EventReportSnapshot {
  return {
    id: row.id as string,
    eventId: (row.event_id as string | null) ?? null,
    eventIds: (row.event_ids as string[]) ?? [],
    title: row.title as string,
    filters: (row.filters as ReportFilters) ?? { eventIds: [] },
    narrativeFields: { ...EMPTY_NARRATIVE_FIELDS, ...(row.narrative_fields as Partial<ReportNarrativeFields>) },
    metricsSnapshot: (row.metrics_snapshot as EventReportPreview | null) ?? null,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    finalizedAt: (row.finalized_at as string | null) ?? null,
    status: row.status as ReportStatus,
  };
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("You must be signed in.");
  return data.user.id;
}

export async function listReportDrafts(): Promise<EventReportSnapshot[]> {
  const { data, error } = await supabase
    .from(SNAPSHOTS_TABLE)
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapSnapshotRow(row as Record<string, unknown>));
}

export async function getReportSnapshot(id: string): Promise<EventReportSnapshot | null> {
  const { data, error } = await supabase.from(SNAPSHOTS_TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapSnapshotRow(data as Record<string, unknown>) : null;
}

export async function saveReportDraft(input: {
  id?: string;
  title: string;
  filters: ReportFilters;
  narrativeFields: ReportNarrativeFields;
  eventIds: string[];
}): Promise<EventReportSnapshot> {
  const userId = await getCurrentUserId();
  const metrics = await buildEventReportPreview(input.filters, input.narrativeFields);
  const payload = {
    event_id: input.eventIds.length === 1 ? input.eventIds[0] : null,
    event_ids: input.eventIds,
    title: input.title || input.narrativeFields.reportTitle || "Event Report",
    filters: input.filters,
    narrative_fields: input.narrativeFields,
    metrics_snapshot: metrics,
    status: "draft" as const,
    created_by: userId,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from(SNAPSHOTS_TABLE)
      .update({
        ...payload,
        metrics_snapshot: metrics,
      })
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) throw error;
    return mapSnapshotRow(data as Record<string, unknown>);
  }

  const { data, error } = await supabase.from(SNAPSHOTS_TABLE).insert(payload).select("*").single();
  if (error) throw error;
  return mapSnapshotRow(data as Record<string, unknown>);
}

export async function finalizeReportSnapshot(id: string): Promise<EventReportSnapshot> {
  const existing = await getReportSnapshot(id);
  if (!existing) throw new Error("Report not found.");
  const metrics = await buildEventReportPreview(existing.filters, existing.narrativeFields);
  const { data, error } = await supabase
    .from(SNAPSHOTS_TABLE)
    .update({
      metrics_snapshot: metrics,
      status: "final",
      finalized_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapSnapshotRow(data as Record<string, unknown>);
}

export async function duplicateReportSnapshot(id: string): Promise<EventReportSnapshot> {
  const existing = await getReportSnapshot(id);
  if (!existing) throw new Error("Report not found.");
  return saveReportDraft({
    title: `${existing.title} (Copy)`,
    filters: existing.filters,
    narrativeFields: existing.narrativeFields,
    eventIds: existing.eventIds,
  });
}

export async function reopenReportDraft(id: string): Promise<EventReportSnapshot> {
  const { data, error } = await supabase
    .from(SNAPSHOTS_TABLE)
    .update({ status: "draft", finalized_at: null })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapSnapshotRow(data as Record<string, unknown>);
}

export async function fetchReportFilterOptions() {
  const [events, categoriesRes, programsRes, institutionsRes] = await Promise.all([
    fetchAdminEvents(),
    supabase.from("event_categories").select("id, name").order("name"),
    supabase.from("programs").select("id, name").eq("is_active", true).order("name"),
    supabase.from("institutions").select("id, name").eq("is_active", true).order("name"),
  ]);

  if (categoriesRes.error) throw categoriesRes.error;
  if (programsRes.error) throw programsRes.error;
  if (institutionsRes.error) throw institutionsRes.error;

  const counties = new Set<string>();
  for (const event of events.slice(0, 50)) {
    const rows = await listEventAttendance(event.id);
    for (const row of rows) {
      if (row.county?.trim()) counties.add(row.county.trim());
    }
  }

  return {
    events: events as EventAdminRow[],
    categories: categoriesRes.data ?? [],
    programs: programsRes.data ?? [],
    institutions: institutionsRes.data ?? [],
    counties: [...counties].sort(),
  };
}

export function estimateUniqueParticipants(rows: EventAttendanceRow[]) {
  const emails = new Set<string>();
  let countedWithoutEmail = 0;
  for (const row of rows) {
    const email = normalizeEmail(row.email);
    if (email) emails.add(email);
    else countedWithoutEmail += 1;
  }
  return {
    uniqueByEmail: emails.size,
    recordsWithoutEmail: countedWithoutEmail,
    totalRecords: rows.length,
    note: "Unique count uses email only. Records without email are counted individually and may overstate unique people.",
  };
}
