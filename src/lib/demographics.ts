import { supabase } from "@/integrations/supabase/client";
import type { AcademicLevel } from "@/lib/institutions";
import { ACADEMIC_LEVEL_LABELS, INSTITUTION_TYPE_LABELS } from "@/lib/institutions";

export type DemographicSourceType = "registration" | "walk_in" | "evaluation" | "attendance";

export type TriStateBoolean = true | false | "prefer_not_to_answer" | null;

export type DemographicFormData = {
  ageRange: string | null;
  race: string | null;
  ethnicity: string | null;
  gender: string | null;
  veteranStatus: string | null;
  disabilityStatus: string | null;
  farmerProducerStatus: string | null;
  beginningFarmer: TriStateBoolean;
  limitedResourceProducer: TriStateBoolean;
  county: string | null;
  state: string | null;
  ruralUrban: string | null;
  institutionId: string | null;
  academicLevel: AcademicLevel | null;
  consent: boolean;
};

export type DemographicValidationError = {
  field: string;
  message: string;
};

export type DemographicAggregateRow = {
  category: string;
  valueLabel: string;
  count: number | null;
  suppressed: boolean;
};

export const PREFER_NOT_TO_ANSWER = "prefer_not_to_answer" as const;

export const DEMOGRAPHIC_CATEGORY_LABELS: Record<string, string> = {
  age_range: "Age range",
  race: "Race",
  ethnicity: "Ethnicity",
  gender: "Gender",
  veteran_status: "Veteran status",
  disability_status: "Disability status",
  farmer_producer_status: "Farmer/producer status",
  beginning_farmer: "Beginning farmer",
  limited_resource_producer: "Limited-resource producer",
  county: "County",
  state: "State",
  rural_urban: "Rural or urban",
  institution_type: "Institution type",
  academic_level: "Academic level",
};

const SMALL_CELL_MIN = 5;

export function buildEmptyDemographicForm(): DemographicFormData {
  return {
    ageRange: null,
    race: null,
    ethnicity: null,
    gender: null,
    veteranStatus: null,
    disabilityStatus: null,
    farmerProducerStatus: null,
    beginningFarmer: null,
    limitedResourceProducer: null,
    county: null,
    state: null,
    ruralUrban: null,
    institutionId: null,
    academicLevel: null,
    consent: false,
  };
}

export function getDemographicOptionGroups() {
  const prefer = { value: PREFER_NOT_TO_ANSWER, label: "Prefer not to answer" };
  return {
    ageRange: [
      { value: "under_18", label: "Under 18" },
      { value: "18_24", label: "18–24" },
      { value: "25_34", label: "25–34" },
      { value: "35_44", label: "35–44" },
      { value: "45_54", label: "45–54" },
      { value: "55_64", label: "55–64" },
      { value: "65_plus", label: "65+" },
      prefer,
    ],
    race: [
      { value: "american_indian_alaska_native", label: "American Indian or Alaska Native" },
      { value: "asian", label: "Asian" },
      { value: "black_african_american", label: "Black or African American" },
      { value: "native_hawaiian_pacific_islander", label: "Native Hawaiian or Pacific Islander" },
      { value: "white", label: "White" },
      { value: "multiracial", label: "Multiracial" },
      { value: "other", label: "Another race" },
      prefer,
    ],
    ethnicity: [
      { value: "hispanic_latino", label: "Hispanic or Latino" },
      { value: "not_hispanic_latino", label: "Not Hispanic or Latino" },
      prefer,
    ],
    gender: [
      { value: "woman", label: "Woman" },
      { value: "man", label: "Man" },
      { value: "non_binary", label: "Non-binary" },
      { value: "another_gender", label: "Another gender" },
      prefer,
    ],
    veteranStatus: [
      { value: "veteran", label: "Veteran" },
      { value: "not_veteran", label: "Not a veteran" },
      prefer,
    ],
    disabilityStatus: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      prefer,
    ],
    farmerProducerStatus: [
      { value: "farmer", label: "Farmer" },
      { value: "rancher", label: "Rancher" },
      { value: "producer", label: "Producer" },
      { value: "not_farmer_producer", label: "Not a farmer/producer" },
      prefer,
    ],
    ruralUrban: [
      { value: "rural", label: "Rural" },
      { value: "urban", label: "Urban" },
      { value: "suburban", label: "Suburban" },
      prefer,
    ],
    triStateBoolean: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: PREFER_NOT_TO_ANSWER, label: "Prefer not to answer" },
    ],
    academicLevel: Object.entries(ACADEMIC_LEVEL_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  };
}

function hasTextValue(value: string | null | undefined) {
  return !!value?.trim();
}

function hasTriStateValue(value: TriStateBoolean) {
  return value === true || value === false || value === PREFER_NOT_TO_ANSWER;
}

export function hasAnyDemographicField(form: DemographicFormData) {
  return (
    hasTextValue(form.ageRange) ||
    hasTextValue(form.race) ||
    hasTextValue(form.ethnicity) ||
    hasTextValue(form.gender) ||
    hasTextValue(form.veteranStatus) ||
    hasTextValue(form.disabilityStatus) ||
    hasTextValue(form.farmerProducerStatus) ||
    hasTriStateValue(form.beginningFarmer) ||
    hasTriStateValue(form.limitedResourceProducer) ||
    hasTextValue(form.county) ||
    hasTextValue(form.state) ||
    hasTextValue(form.ruralUrban) ||
    hasTextValue(form.institutionId) ||
    !!form.academicLevel
  );
}

export function validateDemographicForm(form: DemographicFormData): DemographicValidationError[] {
  const errors: DemographicValidationError[] = [];
  const anyField = hasAnyDemographicField(form);

  if (anyField && !form.consent) {
    errors.push({
      field: "consent",
      message: "Consent is required when providing any demographic information.",
    });
  }

  return errors;
}

function triStateToBoolean(value: TriStateBoolean): boolean | null {
  if (value === true) return true;
  if (value === false) return false;
  return null;
}

function toRpcPayload(form: DemographicFormData) {
  return {
    p_age_range: form.ageRange || null,
    p_race: form.race || null,
    p_ethnicity: form.ethnicity || null,
    p_gender: form.gender || null,
    p_veteran_status: form.veteranStatus || null,
    p_disability_status: form.disabilityStatus || null,
    p_farmer_producer_status: form.farmerProducerStatus || null,
    p_beginning_farmer: triStateToBoolean(form.beginningFarmer),
    p_limited_resource_producer: triStateToBoolean(form.limitedResourceProducer),
    p_county: form.county?.trim() || null,
    p_state: form.state?.trim() || null,
    p_rural_urban: form.ruralUrban || null,
    p_institution_id: form.institutionId || null,
    p_academic_level: form.academicLevel || null,
    p_consent_demographics: true,
  };
}

export async function submitMyParticipantDemographics(
  sourceType: Exclude<DemographicSourceType, "walk_in">,
  sourceId: string,
  form: DemographicFormData,
) {
  const errors = validateDemographicForm(form);
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join(" "));
  }
  if (!hasAnyDemographicField(form)) return null;

  const { data, error } = await supabase.rpc("upsert_my_participant_demographics", {
    p_source_type: sourceType,
    p_source_id: sourceId,
    ...toRpcPayload(form),
  });
  if (error) throw error;
  return data as string;
}

export async function submitAdminWalkInDemographics(walkInId: string, form: DemographicFormData) {
  const errors = validateDemographicForm(form);
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join(" "));
  }
  if (!hasAnyDemographicField(form)) return null;

  const payload = {
    source_type: "walk_in" as const,
    source_id: walkInId,
    user_id: null,
    age_range: form.ageRange,
    race: form.race,
    ethnicity: form.ethnicity,
    gender: form.gender,
    veteran_status: form.veteranStatus,
    disability_status: form.disabilityStatus,
    farmer_producer_status: form.farmerProducerStatus,
    beginning_farmer: triStateToBoolean(form.beginningFarmer),
    limited_resource_producer: triStateToBoolean(form.limitedResourceProducer),
    county: form.county?.trim() || null,
    state: form.state?.trim() || null,
    rural_urban: form.ruralUrban,
    institution_id: form.institutionId,
    academic_level: form.academicLevel,
    consent_demographics: true,
  };

  const { data, error } = await supabase
    .from("participant_demographics")
    .upsert(payload, { onConflict: "source_type,source_id" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function submitAnonymousEvaluationDemographics(
  responseId: string,
  accessToken: string,
  form: DemographicFormData,
) {
  const errors = validateDemographicForm(form);
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.message).join(" "));
  }
  if (!hasAnyDemographicField(form)) return null;

  const { data, error } = await supabase.rpc("upsert_anonymous_evaluation_demographics", {
    p_response_id: responseId,
    p_access_token: accessToken,
    ...toRpcPayload(form),
  });
  if (error) throw error;
  return data as string;
}

function mapAggregateRow(row: Record<string, unknown>): DemographicAggregateRow {
  return {
    category: row.category as string,
    valueLabel: row.value_label as string,
    count: row.suppressed ? null : Number(row.count ?? 0),
    suppressed: Boolean(row.suppressed),
  };
}

export async function getEventDemographicAggregates(eventId: string): Promise<DemographicAggregateRow[]> {
  const { data, error } = await supabase.rpc("get_event_demographic_aggregates", {
    p_event_id: eventId,
  });
  if (error) throw error;
  return (data ?? []).map((row) => mapAggregateRow(row as Record<string, unknown>));
}

export async function getMultiEventDemographicAggregates(
  eventIds: string[],
): Promise<DemographicAggregateRow[]> {
  const { data, error } = await supabase.rpc("get_multi_event_demographic_aggregates", {
    p_event_ids: eventIds,
  });
  if (error) throw error;
  return (data ?? []).map((row) => mapAggregateRow(row as Record<string, unknown>));
}

export function suppressSmallCells<T extends { count: number | null; suppressed: boolean }>(
  rows: T[],
  minCell = SMALL_CELL_MIN,
): T[] {
  return rows.map((row) => {
    if (row.count != null && row.count < minCell) {
      return { ...row, count: null, suppressed: true };
    }
    return row;
  });
}

export function formatDemographicLabel(category: string, valueLabel: string) {
  if (category === "academic_level") {
    return ACADEMIC_LEVEL_LABELS[valueLabel as AcademicLevel] ?? valueLabel.replace(/_/g, " ");
  }
  if (category === "institution_type") {
    return INSTITUTION_TYPE_LABELS[valueLabel as keyof typeof INSTITUTION_TYPE_LABELS] ?? valueLabel;
  }
  if (valueLabel === PREFER_NOT_TO_ANSWER) return "Prefer not to answer";
  return valueLabel.replace(/_/g, " ");
}

export function groupDemographicAggregates(rows: DemographicAggregateRow[]) {
  const groups = new Map<string, DemographicAggregateRow[]>();
  for (const row of rows) {
    const list = groups.get(row.category) ?? [];
    list.push(row);
    groups.set(row.category, list);
  }
  return groups;
}

export function filterNonDemographicEvaluationQuestions<
  T extends { isDemographic: boolean; questionType: string },
>(questions: T[]) {
  return questions.filter((q) => !q.isDemographic && q.questionType !== "demographic");
}

export function demographicFormFromEvaluationAnswers(
  questions: { id: string; prompt: string; isDemographic: boolean }[],
  answers: Map<string, { valueText?: string | null; valueNumber?: number | null; valueJson?: unknown }>,
): DemographicFormData {
  const form = buildEmptyDemographicForm();
  for (const question of questions.filter((q) => q.isDemographic)) {
    const answer = answers.get(question.id);
    if (!answer) continue;
    const text = (answer.valueText ?? "").toLowerCase();
    const prompt = question.prompt.toLowerCase();

    if (prompt.includes("age")) form.ageRange = answer.valueText ?? null;
    else if (prompt.includes("race")) form.race = answer.valueText ?? null;
    else if (prompt.includes("ethnic")) form.ethnicity = answer.valueText ?? null;
    else if (prompt.includes("gender")) form.gender = answer.valueText ?? null;
    else if (prompt.includes("veteran")) form.veteranStatus = answer.valueText ?? null;
    else if (prompt.includes("disabilit")) form.disabilityStatus = answer.valueText ?? null;
    else if (prompt.includes("farmer") || prompt.includes("producer")) {
      form.farmerProducerStatus = answer.valueText ?? null;
    } else if (prompt.includes("beginning")) {
      form.beginningFarmer = text === "yes" ? true : text === "no" ? false : PREFER_NOT_TO_ANSWER;
    } else if (prompt.includes("limited")) {
      form.limitedResourceProducer = text === "yes" ? true : text === "no" ? false : PREFER_NOT_TO_ANSWER;
    } else if (prompt.includes("county")) form.county = answer.valueText ?? null;
    else if (prompt.includes("state")) form.state = answer.valueText ?? null;
    else if (prompt.includes("rural") || prompt.includes("urban")) form.ruralUrban = answer.valueText ?? null;
    else if (prompt.includes("academic")) form.academicLevel = (answer.valueText as AcademicLevel) ?? null;
  }
  return form;
}
