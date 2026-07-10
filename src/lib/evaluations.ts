import { supabase } from "@/integrations/supabase/client";
import { toCsv, type CsvColumn } from "@/lib/csv";

export type EvaluationQuestionType =
  | "rating"
  | "single_choice"
  | "multi_choice"
  | "short_text"
  | "long_text"
  | "yes_no"
  | "number"
  | "demographic"
  | "consent";

export type EvaluationResponseMode = "anonymous" | "identified";

export type EvaluationAvailability =
  | "unavailable"
  | "inactive"
  | "not_open"
  | "closed"
  | "qualtrics"
  | "native"
  | "login_required";

export type EventEvaluation = {
  id: string;
  eventId: string;
  title: string;
  qualtricsUrl: string | null;
  useNativeForm: boolean;
  isRequired: boolean;
  responseMode: EvaluationResponseMode;
  opensAt: string | null;
  closesAt: string | null;
  reminderSentAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EvaluationQuestion = {
  id: string;
  evaluationId: string;
  sortOrder: number;
  questionType: EvaluationQuestionType;
  prompt: string;
  helpText: string | null;
  isRequired: boolean;
  options: Record<string, unknown> | null;
  isDemographic: boolean;
  isDefault: boolean;
};

export type EvaluationAnswerInput = {
  questionId: string;
  valueText?: string | null;
  valueNumber?: number | null;
  valueJson?: unknown;
};

export type EvaluationCompletionStatus = {
  isComplete: boolean;
  completedAt: string | null;
  responseId: string | null;
  canResume: boolean;
};

export type PendingEvaluation = {
  evaluationId: string;
  eventId: string;
  eventTitle: string;
  eventStartsAt: string;
  evaluationTitle: string;
  closesAt: string | null;
  isRequired: boolean;
  responseMode: EvaluationResponseMode;
  attendanceId: string | null;
  registrationId: string | null;
};

export type CompletedEvaluation = PendingEvaluation & {
  completedAt: string;
};

export type AdminEvaluationResponseRow = {
  responseId: string;
  eventId: string;
  eventTitle: string;
  evaluationTitle: string;
  responseMode: EvaluationResponseMode;
  submittedAt: string | null;
  isComplete: boolean;
  participantName: string | null;
  participantEmail: string | null;
  questionId: string;
  questionPrompt: string;
  questionType: EvaluationQuestionType;
  answerText: string;
};

export type QuestionSummary = {
  questionId: string;
  prompt: string;
  questionType: EvaluationQuestionType;
  responseCount: number;
  averageRating: number | null;
  choiceCounts: Record<string, number>;
  openTextSamples: string[];
};

export type EvaluationSummary = {
  totalResponses: number;
  completedResponses: number;
  responseRate: number;
  averageRating: number | null;
  identifiedCount: number;
  anonymousCount: number;
  questionSummaries: QuestionSummary[];
};

export const EVALUATION_QUESTION_TYPE_LABELS: Record<EvaluationQuestionType, string> = {
  rating: "Rating",
  single_choice: "Single choice",
  multi_choice: "Multiple choice",
  short_text: "Short text",
  long_text: "Long text",
  yes_no: "Yes / No",
  number: "Number",
  demographic: "Demographic",
  consent: "Consent",
};

export const EVALUATION_RESPONSE_MODE_LABELS: Record<EvaluationResponseMode, string> = {
  anonymous: "Anonymous",
  identified: "Identified",
};

const EVALUATION_SELECT = `
  id,
  event_id,
  title,
  qualtrics_url,
  use_native_form,
  is_required,
  response_mode,
  opens_at,
  closes_at,
  reminder_sent_at,
  is_active,
  created_at,
  updated_at
`;

const QUESTION_SELECT = `
  id,
  evaluation_id,
  sort_order,
  question_type,
  prompt,
  help_text,
  is_required,
  options,
  is_demographic,
  is_default
`;

/** Never select access_token_hash in browser queries. */
const RESPONSE_SELECT = `
  id,
  evaluation_id,
  event_id,
  user_id,
  registration_id,
  attendance_id,
  submitted_at,
  is_complete,
  created_at,
  updated_at
`;

const ANON_TOKEN_STORAGE_PREFIX = "jesup-eval-token:";

function mapEvaluation(row: Record<string, unknown>): EventEvaluation {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    title: row.title as string,
    qualtricsUrl: (row.qualtrics_url as string | null) ?? null,
    useNativeForm: row.use_native_form as boolean,
    isRequired: row.is_required as boolean,
    responseMode: row.response_mode as EvaluationResponseMode,
    opensAt: (row.opens_at as string | null) ?? null,
    closesAt: (row.closes_at as string | null) ?? null,
    reminderSentAt: (row.reminder_sent_at as string | null) ?? null,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapQuestion(row: Record<string, unknown>): EvaluationQuestion {
  return {
    id: row.id as string,
    evaluationId: row.evaluation_id as string,
    sortOrder: row.sort_order as number,
    questionType: row.question_type as EvaluationQuestionType,
    prompt: row.prompt as string,
    helpText: (row.help_text as string | null) ?? null,
    isRequired: row.is_required as boolean,
    options: (row.options as Record<string, unknown> | null) ?? null,
    isDemographic: row.is_demographic as boolean,
    isDefault: row.is_default as boolean,
  };
}

export function getEvaluationPublicUrl(eventId: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/events/${eventId}/evaluation`;
  }
  return `/events/${eventId}/evaluation`;
}

export function getEvaluationAvailability(
  evaluation: EventEvaluation | null,
  options?: { isAuthenticated?: boolean },
): EvaluationAvailability {
  if (!evaluation || !evaluation.isActive) return evaluation ? "inactive" : "unavailable";

  const now = Date.now();
  if (evaluation.opensAt && new Date(evaluation.opensAt).getTime() > now) return "not_open";
  if (evaluation.closesAt && new Date(evaluation.closesAt).getTime() < now) return "closed";

  if (!evaluation.useNativeForm) {
    return evaluation.qualtricsUrl ? "qualtrics" : "unavailable";
  }

  if (evaluation.responseMode === "identified" && !options?.isAuthenticated) {
    return "login_required";
  }

  return "native";
}

export async function getEventEvaluation(eventId: string): Promise<EventEvaluation | null> {
  const { data, error } = await supabase
    .from("event_evaluations")
    .select(EVALUATION_SELECT)
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEvaluation(data as Record<string, unknown>) : null;
}

export async function getEvaluationById(evaluationId: string): Promise<EventEvaluation | null> {
  const { data, error } = await supabase
    .from("event_evaluations")
    .select(EVALUATION_SELECT)
    .eq("id", evaluationId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEvaluation(data as Record<string, unknown>) : null;
}

export async function listEvaluationQuestions(evaluationId: string): Promise<EvaluationQuestion[]> {
  const { data, error } = await supabase
    .from("event_evaluation_questions")
    .select(QUESTION_SELECT)
    .eq("evaluation_id", evaluationId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((row) => mapQuestion(row as Record<string, unknown>));
}

export type EventEvaluationInput = {
  eventId: string;
  title: string;
  qualtricsUrl?: string | null;
  useNativeForm: boolean;
  isRequired: boolean;
  responseMode: EvaluationResponseMode;
  opensAt?: string | null;
  closesAt?: string | null;
  isActive: boolean;
};

async function syncLegacyEventSurvey(eventId: string, input: EventEvaluationInput) {
  const useQualtrics = !input.useNativeForm && !!input.qualtricsUrl?.trim();
  if (useQualtrics) {
    const { error } = await supabase.from("event_surveys").upsert(
      {
        event_id: eventId,
        title: input.title || "Post-event survey",
        qualtrics_url: input.qualtricsUrl?.trim() || null,
        is_active: input.isActive,
      },
      { onConflict: "event_id" },
    );
    if (error) throw error;
  } else {
    await supabase.from("event_surveys").delete().eq("event_id", eventId);
  }
}

export async function createOrUpdateEventEvaluation(input: EventEvaluationInput): Promise<EventEvaluation> {
  const payload = {
    event_id: input.eventId,
    title: input.title.trim() || "Post-event evaluation",
    qualtrics_url: input.qualtricsUrl?.trim() || null,
    use_native_form: input.useNativeForm,
    is_required: input.isRequired,
    response_mode: input.responseMode,
    opens_at: input.opensAt || null,
    closes_at: input.closesAt || null,
    is_active: input.isActive,
  };

  const { data, error } = await supabase
    .from("event_evaluations")
    .upsert(payload, { onConflict: "event_id" })
    .select(EVALUATION_SELECT)
    .single();
  if (error) throw error;

  await syncLegacyEventSurvey(input.eventId, input);
  return mapEvaluation(data as Record<string, unknown>);
}

export type EvaluationQuestionInput = {
  evaluationId: string;
  questionType: EvaluationQuestionType;
  prompt: string;
  helpText?: string | null;
  isRequired?: boolean;
  options?: Record<string, unknown> | null;
  isDemographic?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
};

export async function createEvaluationQuestion(input: EvaluationQuestionInput): Promise<EvaluationQuestion> {
  const questions = await listEvaluationQuestions(input.evaluationId);
  const sortOrder = input.sortOrder ?? questions.length;

  const { data, error } = await supabase
    .from("event_evaluation_questions")
    .insert({
      evaluation_id: input.evaluationId,
      sort_order: sortOrder,
      question_type: input.questionType,
      prompt: input.prompt.trim(),
      help_text: input.helpText?.trim() || null,
      is_required: input.isRequired ?? false,
      options: input.options ?? null,
      is_demographic: input.isDemographic ?? false,
      is_default: input.isDefault ?? false,
    })
    .select(QUESTION_SELECT)
    .single();
  if (error) throw error;
  return mapQuestion(data as Record<string, unknown>);
}

export async function updateEvaluationQuestion(
  questionId: string,
  patch: Partial<Omit<EvaluationQuestionInput, "evaluationId">>,
): Promise<EvaluationQuestion> {
  const payload: Record<string, unknown> = {};
  if (patch.questionType) payload.question_type = patch.questionType;
  if (patch.prompt !== undefined) payload.prompt = patch.prompt.trim();
  if (patch.helpText !== undefined) payload.help_text = patch.helpText?.trim() || null;
  if (patch.isRequired !== undefined) payload.is_required = patch.isRequired;
  if (patch.options !== undefined) payload.options = patch.options;
  if (patch.isDemographic !== undefined) payload.is_demographic = patch.isDemographic;
  if (patch.isDefault !== undefined) payload.is_default = patch.isDefault;
  if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder;

  const { data, error } = await supabase
    .from("event_evaluation_questions")
    .update(payload)
    .eq("id", questionId)
    .select(QUESTION_SELECT)
    .single();
  if (error) throw error;
  return mapQuestion(data as Record<string, unknown>);
}

export async function deleteEvaluationQuestion(questionId: string) {
  const { error } = await supabase.from("event_evaluation_questions").delete().eq("id", questionId);
  if (error) throw error;
}

export async function reorderEvaluationQuestions(evaluationId: string, orderedQuestionIds: string[]) {
  await Promise.all(
    orderedQuestionIds.map((questionId, index) =>
      supabase
        .from("event_evaluation_questions")
        .update({ sort_order: index })
        .eq("id", questionId)
        .eq("evaluation_id", evaluationId),
    ),
  );
}

export const DEFAULT_EVALUATION_TEMPLATE: Omit<EvaluationQuestionInput, "evaluationId">[] = [
  {
    questionType: "rating",
    prompt: "Overall event rating",
    isRequired: true,
    isDefault: true,
    options: { min: 1, max: 5, labels: ["Poor", "Fair", "Good", "Very good", "Excellent"] },
  },
  {
    questionType: "rating",
    prompt: "Relevance of information",
    isRequired: true,
    isDefault: true,
    options: { min: 1, max: 5 },
  },
  {
    questionType: "rating",
    prompt: "Presenter effectiveness",
    isRequired: true,
    isDefault: true,
    options: { min: 1, max: 5 },
  },
  {
    questionType: "rating",
    prompt: "Knowledge gained",
    isRequired: true,
    isDefault: true,
    options: { min: 1, max: 5 },
  },
  {
    questionType: "rating",
    prompt: "Likelihood of applying what was learned",
    isRequired: true,
    isDefault: true,
    options: { min: 1, max: 5 },
  },
  {
    questionType: "long_text",
    prompt: "What was most valuable?",
    isRequired: false,
    isDefault: true,
  },
  {
    questionType: "long_text",
    prompt: "What could be improved?",
    isRequired: false,
    isDefault: true,
  },
  {
    questionType: "single_choice",
    prompt: "Interest in future programs",
    isRequired: false,
    isDefault: true,
    options: { choices: ["Yes", "Maybe", "No"] },
  },
  {
    questionType: "consent",
    prompt: "Permission for follow-up",
    helpText: "May we contact you about future programs related to this event?",
    isRequired: false,
    isDefault: true,
  },
];

/** Idempotent: skips insert when default questions already exist. */
export async function insertDefaultEvaluationTemplate(evaluationId: string): Promise<number> {
  const existing = await listEvaluationQuestions(evaluationId);
  if (existing.some((q) => q.isDefault)) return 0;

  let created = 0;
  for (const [index, template] of DEFAULT_EVALUATION_TEMPLATE.entries()) {
    await createEvaluationQuestion({
      evaluationId,
      ...template,
      sortOrder: existing.length + index,
    });
    created += 1;
  }
  return created;
}

function assertEvaluationWindow(evaluation: EventEvaluation) {
  const availability = getEvaluationAvailability(evaluation);
  if (availability === "not_open") throw new Error("This evaluation is not open yet.");
  if (availability === "closed") throw new Error("This evaluation has closed.");
  if (availability === "inactive" || availability === "unavailable") {
    throw new Error("This evaluation is not available.");
  }
}

export function storeAnonymousEvaluationToken(responseId: string, token: string) {
  sessionStorage.setItem(`${ANON_TOKEN_STORAGE_PREFIX}${responseId}`, token);
}

export function readAnonymousEvaluationToken(responseId: string): string | null {
  return sessionStorage.getItem(`${ANON_TOKEN_STORAGE_PREFIX}${responseId}`);
}

export function clearAnonymousEvaluationToken(responseId: string) {
  sessionStorage.removeItem(`${ANON_TOKEN_STORAGE_PREFIX}${responseId}`);
}

export async function createAnonymousEvaluationResponse(evaluationId: string) {
  const evaluation = await getEvaluationById(evaluationId);
  if (!evaluation) throw new Error("Evaluation not found.");
  assertEvaluationWindow(evaluation);

  const { data, error } = await supabase.rpc("create_anonymous_evaluation_response", {
    p_evaluation_id: evaluationId,
  });
  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as {
    response_id: string;
    access_token: string;
  } | null;
  if (!row?.response_id || !row.access_token) {
    throw new Error("Could not start anonymous evaluation.");
  }

  storeAnonymousEvaluationToken(row.response_id, row.access_token);
  return { responseId: row.response_id, accessToken: row.access_token };
}

export async function submitAnonymousEvaluationAnswers(
  responseId: string,
  accessToken: string,
  answers: EvaluationAnswerInput[],
) {
  const payload = answers.map((answer) => ({
    question_id: answer.questionId,
    value_text: answer.valueText ?? null,
    value_number: answer.valueNumber ?? null,
    value_json: answer.valueJson ?? null,
  }));

  const { error } = await supabase.rpc("submit_anonymous_evaluation_answers", {
    p_response_id: responseId,
    p_access_token: accessToken,
    p_answers: payload,
  });
  if (error) throw error;

  clearAnonymousEvaluationToken(responseId);
}

export async function markMyAttendanceEvaluationComplete(attendanceId: string) {
  const { error } = await supabase.rpc("mark_my_attendance_evaluation_complete", {
    p_attendance_id: attendanceId,
  });
  if (error) throw error;
}

async function findOwnedAttendanceLinks(eventId: string, userId: string) {
  const { data: registration, error: regError } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();
  if (regError) throw regError;

  let attendanceId: string | null = null;
  if (registration?.id) {
    const { data: attendance, error: attError } = await supabase
      .from("event_attendance")
      .select("id")
      .eq("event_id", eventId)
      .eq("registration_id", registration.id)
      .maybeSingle();
    if (attError) throw attError;
    attendanceId = attendance?.id ?? null;
  }

  return {
    registrationId: registration?.id ?? null,
    attendanceId,
  };
}

export async function createIdentifiedEvaluationResponse(evaluationId: string, eventId: string) {
  const evaluation = await getEvaluationById(evaluationId);
  if (!evaluation) throw new Error("Evaluation not found.");
  if (evaluation.responseMode !== "identified") {
    throw new Error("This evaluation requires anonymous submission.");
  }
  assertEvaluationWindow(evaluation);

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Sign in to complete this evaluation.");

  const { data: existingComplete, error: completeError } = await supabase
    .from("event_evaluation_responses")
    .select(RESPONSE_SELECT)
    .eq("evaluation_id", evaluationId)
    .eq("user_id", userId)
    .eq("is_complete", true)
    .maybeSingle();
  if (completeError) throw completeError;
  if (existingComplete) throw new Error("You have already completed this evaluation.");

  const { data: existingIncomplete, error: incompleteError } = await supabase
    .from("event_evaluation_responses")
    .select(RESPONSE_SELECT)
    .eq("evaluation_id", evaluationId)
    .eq("user_id", userId)
    .eq("is_complete", false)
    .maybeSingle();
  if (incompleteError) throw incompleteError;
  if (existingIncomplete) {
    return { responseId: existingIncomplete.id as string, resumed: true };
  }

  const links = await findOwnedAttendanceLinks(eventId, userId);

  const { data, error } = await supabase
    .from("event_evaluation_responses")
    .insert({
      evaluation_id: evaluationId,
      event_id: eventId,
      user_id: userId,
      registration_id: links.registrationId,
      attendance_id: links.attendanceId,
      is_complete: false,
    })
    .select("id")
    .single();
  if (error) throw error;

  return { responseId: data.id as string, resumed: false };
}

export async function submitIdentifiedEvaluationAnswers(
  responseId: string,
  evaluationId: string,
  answers: EvaluationAnswerInput[],
  attendanceId?: string | null,
) {
  const evaluation = await getEvaluationById(evaluationId);
  if (!evaluation) throw new Error("Evaluation not found.");
  assertEvaluationWindow(evaluation);

  const { data: response, error: responseError } = await supabase
    .from("event_evaluation_responses")
    .select(RESPONSE_SELECT)
    .eq("id", responseId)
    .eq("evaluation_id", evaluationId)
    .single();
  if (responseError) throw responseError;
  if (response.is_complete) throw new Error("This evaluation has already been submitted.");

  for (const answer of answers) {
    const { error } = await supabase.from("event_evaluation_answers").upsert(
      {
        response_id: responseId,
        question_id: answer.questionId,
        value_text: answer.valueText ?? null,
        value_number: answer.valueNumber ?? null,
        value_json: (answer.valueJson as object | null) ?? null,
      },
      { onConflict: "response_id,question_id" },
    );
    if (error) throw error;
  }

  const now = new Date().toISOString();
  const { error: completeError } = await supabase
    .from("event_evaluation_responses")
    .update({ is_complete: true, submitted_at: now })
    .eq("id", responseId);
  if (completeError) throw completeError;

  const attendanceToMark = attendanceId ?? (response.attendance_id as string | null);
  if (attendanceToMark) {
    await markMyAttendanceEvaluationComplete(attendanceToMark);
  }
}

export async function getEvaluationCompletionStatus(
  evaluationId: string,
  userId?: string | null,
): Promise<EvaluationCompletionStatus> {
  if (!userId) {
    return { isComplete: false, completedAt: null, responseId: null, canResume: false };
  }

  const { data: response, error } = await supabase
    .from("event_evaluation_responses")
    .select(RESPONSE_SELECT)
    .eq("evaluation_id", evaluationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  if (response?.is_complete) {
    return {
      isComplete: true,
      completedAt: (response.submitted_at as string | null) ?? null,
      responseId: response.id as string,
      canResume: false,
    };
  }

  if (response) {
    return {
      isComplete: false,
      completedAt: null,
      responseId: response.id as string,
      canResume: true,
    };
  }

  return { isComplete: false, completedAt: null, responseId: null, canResume: false };
}

export async function getMyPendingEvaluations(userId: string): Promise<PendingEvaluation[]> {
  const { data: registrations, error } = await supabase
    .from("event_registrations")
    .select("id, event_id, events ( id, title, starts_at, status, is_active )")
    .eq("user_id", userId)
    .eq("status", "registered");
  if (error) throw error;

  const pending: PendingEvaluation[] = [];
  const now = Date.now();

  for (const reg of registrations ?? []) {
    const event = reg.events as {
      id: string;
      title: string;
      starts_at: string;
      status: string;
      is_active: boolean;
    } | null;
    if (!event || event.status !== "published" || !event.is_active) continue;

    const evaluation = await getEventEvaluation(reg.event_id);
    if (!evaluation?.isActive || !evaluation.useNativeForm) continue;
    if (evaluation.opensAt && new Date(evaluation.opensAt).getTime() > now) continue;
    if (evaluation.closesAt && new Date(evaluation.closesAt).getTime() < now) continue;

    const status = await getEvaluationCompletionStatus(evaluation.id, userId);

    const { data: attendance } = await supabase
      .from("event_attendance")
      .select("id, evaluation_completed_at")
      .eq("event_id", reg.event_id)
      .eq("registration_id", reg.id)
      .maybeSingle();

    const attendanceComplete = !!attendance?.evaluation_completed_at;
    if (status.isComplete || attendanceComplete) continue;

    pending.push({
      evaluationId: evaluation.id,
      eventId: reg.event_id,
      eventTitle: event.title,
      eventStartsAt: event.starts_at,
      evaluationTitle: evaluation.title,
      closesAt: evaluation.closesAt,
      isRequired: evaluation.isRequired,
      responseMode: evaluation.responseMode,
      attendanceId: (attendance?.id as string | null) ?? null,
      registrationId: reg.id,
    });
  }

  return pending;
}

export async function getMyCompletedEvaluations(userId: string): Promise<CompletedEvaluation[]> {
  const { data: responses, error } = await supabase
    .from("event_evaluation_responses")
    .select(`${RESPONSE_SELECT}, event_evaluations ( title, response_mode ), events ( title, starts_at )`)
    .eq("user_id", userId)
    .eq("is_complete", true)
    .order("submitted_at", { ascending: false });
  if (error) throw error;

  return (responses ?? []).map((row) => {
    const evaluation = row.event_evaluations as { title: string; response_mode: EvaluationResponseMode } | null;
    const event = row.events as { title: string; starts_at: string } | null;
    return {
      evaluationId: row.evaluation_id as string,
      eventId: row.event_id as string,
      eventTitle: event?.title ?? "Event",
      eventStartsAt: event?.starts_at ?? "",
      evaluationTitle: evaluation?.title ?? "Evaluation",
      closesAt: null,
      isRequired: false,
      responseMode: evaluation?.response_mode ?? "identified",
      attendanceId: (row.attendance_id as string | null) ?? null,
      registrationId: (row.registration_id as string | null) ?? null,
      completedAt: (row.submitted_at as string) ?? (row.updated_at as string),
    };
  });
}

function formatAnswerValue(
  question: EvaluationQuestion,
  answer: { value_text: string | null; value_number: number | null; value_json: unknown },
): string {
  if (question.questionType === "multi_choice" && Array.isArray(answer.value_json)) {
    return answer.value_json.join("; ");
  }
  if (answer.value_number != null) return String(answer.value_number);
  if (answer.value_text) return answer.value_text;
  if (typeof answer.value_json === "boolean") return answer.value_json ? "yes" : "no";
  if (answer.value_json != null) return JSON.stringify(answer.value_json);
  return "";
}

export async function listAdminEvaluationResponses(eventId: string): Promise<AdminEvaluationResponseRow[]> {
  const evaluation = await getEventEvaluation(eventId);
  if (!evaluation) return [];

  const { data: responses, error: responseError } = await supabase
    .from("event_evaluation_responses")
    .select(RESPONSE_SELECT)
    .eq("event_id", eventId)
    .eq("evaluation_id", evaluation.id)
    .order("submitted_at", { ascending: false });
  if (responseError) throw responseError;

  const questions = await listEvaluationQuestions(evaluation.id);
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const identifiedUserIds = [
    ...new Set(
      (responses ?? [])
        .map((r) => r.user_id as string | null)
        .filter((id): id is string => !!id),
    ),
  ];

  const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
  if (identifiedUserIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", identifiedUserIds);
    if (profileError) throw profileError;
    for (const profile of profiles ?? []) {
      profileMap.set(profile.id, {
        full_name: profile.full_name,
        email: profile.email,
      });
    }
  }

  const { data: eventRow } = await supabase.from("events").select("title").eq("id", eventId).maybeSingle();
  const eventTitle = eventRow?.title ?? "Event";

  const rows: AdminEvaluationResponseRow[] = [];

  for (const response of responses ?? []) {
    const isIdentified = !!response.user_id;
    const profile = isIdentified ? profileMap.get(response.user_id as string) : null;

    const { data: answers, error: answerError } = await supabase
      .from("event_evaluation_answers")
      .select("question_id, value_text, value_number, value_json")
      .eq("response_id", response.id);
    if (answerError) throw answerError;

    for (const answer of answers ?? []) {
      const question = questionMap.get(answer.question_id as string);
      if (!question) continue;
      if (question.isDemographic || question.questionType === "demographic") continue;

      rows.push({
        responseId: response.id as string,
        eventId,
        eventTitle,
        evaluationTitle: evaluation.title,
        responseMode: isIdentified ? "identified" : "anonymous",
        submittedAt: (response.submitted_at as string | null) ?? null,
        isComplete: response.is_complete as boolean,
        participantName: isIdentified ? (profile?.full_name ?? null) : null,
        participantEmail: isIdentified ? (profile?.email ?? null) : null,
        questionId: question.id,
        questionPrompt: question.prompt,
        questionType: question.questionType,
        answerText: formatAnswerValue(question, answer),
      });
    }
  }

  return rows;
}

export async function getEvaluationSummary(eventId: string): Promise<EvaluationSummary> {
  const evaluation = await getEventEvaluation(eventId);
  if (!evaluation) {
    return {
      totalResponses: 0,
      completedResponses: 0,
      responseRate: 0,
      averageRating: null,
      identifiedCount: 0,
      anonymousCount: 0,
      questionSummaries: [],
    };
  }

  const { data: responses, error } = await supabase
    .from("event_evaluation_responses")
    .select(RESPONSE_SELECT)
    .eq("evaluation_id", evaluation.id);
  if (error) throw error;

  const allResponses = responses ?? [];
  const completed = allResponses.filter((r) => r.is_complete);
  const identifiedCount = completed.filter((r) => r.user_id).length;
  const anonymousCount = completed.length - identifiedCount;

  const { count: eligibleCount } = await supabase
    .from("event_attendance")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);
  const eligible = eligibleCount ?? 0;
  const responseRate = eligible > 0 ? Math.round((completed.length / eligible) * 1000) / 10 : 0;

  const questions = await listEvaluationQuestions(evaluation.id);
  const questionSummaries: QuestionSummary[] = [];

  let ratingSum = 0;
  let ratingCount = 0;

  for (const question of questions) {
    if (question.isDemographic || question.questionType === "demographic") continue;
    const summary: QuestionSummary = {
      questionId: question.id,
      prompt: question.prompt,
      questionType: question.questionType,
      responseCount: 0,
      averageRating: null,
      choiceCounts: {},
      openTextSamples: [],
    };

    for (const response of completed) {
      const { data: answer } = await supabase
        .from("event_evaluation_answers")
        .select("value_text, value_number, value_json")
        .eq("response_id", response.id)
        .eq("question_id", question.id)
        .maybeSingle();
      if (!answer) continue;

      summary.responseCount += 1;
      const text = formatAnswerValue(question, answer);

      if (question.questionType === "rating" && answer.value_number != null) {
        ratingSum += Number(answer.value_number);
        ratingCount += 1;
        const current = summary.averageRating ?? 0;
        summary.averageRating =
          Math.round(((current * (summary.responseCount - 1) + Number(answer.value_number)) / summary.responseCount) * 10) / 10;
      }

      if (question.questionType === "single_choice" || question.questionType === "yes_no") {
        const key = text || "—";
        summary.choiceCounts[key] = (summary.choiceCounts[key] ?? 0) + 1;
      }

      if (question.questionType === "multi_choice" && Array.isArray(answer.value_json)) {
        for (const choice of answer.value_json) {
          const key = String(choice);
          summary.choiceCounts[key] = (summary.choiceCounts[key] ?? 0) + 1;
        }
      }

      if (
        (question.questionType === "long_text" || question.questionType === "short_text") &&
        text &&
        summary.openTextSamples.length < 5
      ) {
        summary.openTextSamples.push(text);
      }
    }

    questionSummaries.push(summary);
  }

  return {
    totalResponses: allResponses.length,
    completedResponses: completed.length,
    responseRate,
    averageRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
    identifiedCount,
    anonymousCount,
    questionSummaries,
  };
}

export type EvaluationValidationError = {
  questionId: string;
  prompt: string;
  message: string;
};

export function validateEvaluationAnswers(
  questions: EvaluationQuestion[],
  answers: Map<string, EvaluationAnswerInput>,
): EvaluationValidationError[] {
  const errors: EvaluationValidationError[] = [];

  for (const question of questions) {
    const answer = answers.get(question.id);
    const hasValue =
      !!answer &&
      ((answer.valueText != null && answer.valueText !== "") ||
        answer.valueNumber != null ||
        (answer.valueJson != null &&
          (Array.isArray(answer.valueJson)
            ? answer.valueJson.length > 0
            : answer.valueJson !== false)));

    if (question.isRequired && !hasValue) {
      errors.push({
        questionId: question.id,
        prompt: question.prompt,
        message: "This question is required.",
      });
      continue;
    }
    if (!answer) continue;

    if (question.questionType === "rating" || question.questionType === "number") {
      const min = Number(question.options?.min ?? 1);
      const max = Number(question.options?.max ?? 5);
      const value = answer.valueNumber;
      if (value == null || value < min || value > max) {
        errors.push({
          questionId: question.id,
          prompt: question.prompt,
          message: `Enter a number between ${min} and ${max}.`,
        });
      }
    }

    if (question.questionType === "single_choice") {
      const choices = (question.options?.choices as string[] | undefined) ?? [];
      if (answer.valueText && !choices.includes(answer.valueText)) {
        errors.push({
          questionId: question.id,
          prompt: question.prompt,
          message: "Select a valid option.",
        });
      }
    }

    if (question.questionType === "multi_choice") {
      const choices = (question.options?.choices as string[] | undefined) ?? [];
      const selected = Array.isArray(answer.valueJson) ? (answer.valueJson as string[]) : [];
      if (selected.some((value) => !choices.includes(value))) {
        errors.push({
          questionId: question.id,
          prompt: question.prompt,
          message: "Select valid options.",
        });
      }
    }

    if (question.questionType === "consent") {
      const accepted = answer.valueJson === true || answer.valueText === "yes";
      if (question.isRequired && !accepted) {
        errors.push({
          questionId: question.id,
          prompt: question.prompt,
          message: "Consent is required to continue.",
        });
      }
    }
  }

  return errors;
}

export const EVALUATION_RESPONSE_EXPORT_COLUMNS: CsvColumn<AdminEvaluationResponseRow>[] = [
  { header: "response_mode", get: (r) => EVALUATION_RESPONSE_MODE_LABELS[r.responseMode] },
  { header: "submitted_at", get: (r) => r.submittedAt },
  { header: "event", get: (r) => r.eventTitle },
  { header: "evaluation", get: (r) => r.evaluationTitle },
  { header: "question", get: (r) => r.questionPrompt },
  { header: "question_type", get: (r) => EVALUATION_QUESTION_TYPE_LABELS[r.questionType] },
  { header: "answer", get: (r) => r.answerText },
  { header: "participant_name", get: (r) => (r.responseMode === "identified" ? r.participantName : "") },
  { header: "participant_email", get: (r) => (r.responseMode === "identified" ? r.participantEmail : "") },
];

export function exportEvaluationResponsesCsv(rows: AdminEvaluationResponseRow[]) {
  return toCsv(rows, EVALUATION_RESPONSE_EXPORT_COLUMNS);
}
