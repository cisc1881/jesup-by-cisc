import { supabase } from "@/integrations/supabase/client";

export type InstitutionType =
  | "land_grant_1890"
  | "four_year"
  | "community_college"
  | "high_school"
  | "technical_school"
  | "recent_graduate"
  | "not_enrolled"
  | "other";

export type AcademicLevel = "high_school" | "undergraduate" | "graduate" | "recent_graduate" | "other";

export type Institution = {
  id: string;
  name: string;
  slug: string;
  institutionType: InstitutionType;
  state: string | null;
  website: string | null;
  is1890LandGrant: boolean;
  isActive: boolean;
  sortOrder: number;
};

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  land_grant_1890: "1890 land-grant university",
  four_year: "Other four-year university",
  community_college: "Community college",
  high_school: "High school",
  technical_school: "Technical school",
  recent_graduate: "Recent graduate",
  not_enrolled: "Not currently enrolled",
  other: "Other",
};

/** Admin and review surfaces use these clearer labels. */
export const INSTITUTION_TYPE_ADMIN_LABELS: Record<InstitutionType, string> = {
  land_grant_1890: "1890 Land-Grant Institution",
  four_year: "Other College or University",
  community_college: "Community College",
  high_school: "High School",
  technical_school: "Technical School",
  recent_graduate: "Recent Graduate",
  not_enrolled: "Not Currently Enrolled",
  other: "Other",
};

export const ACADEMIC_LEVEL_LABELS: Record<AcademicLevel, string> = {
  high_school: "High school",
  undergraduate: "Undergraduate",
  graduate: "Graduate",
  recent_graduate: "Recent graduate",
  other: "Other",
};

export const OTHER_INSTITUTION_SLUG = "other";

const institutionSelect =
  "id, name, slug, institution_type, state, website, is_1890_land_grant, is_active, sort_order";

function mapInstitution(row: Record<string, unknown>): Institution {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    institutionType: row.institution_type as InstitutionType,
    state: (row.state as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    is1890LandGrant: Boolean(row.is_1890_land_grant),
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function listInstitutions(options?: {
  activeOnly?: boolean;
  includeOther?: boolean;
  landGrant1890Only?: boolean;
}) {
  let query = supabase.from("institutions").select(institutionSelect).order("sort_order").order("name");

  if (options?.activeOnly !== false) query = query.eq("is_active", true);
  if (options?.landGrant1890Only) query = query.eq("is_1890_land_grant", true);
  if (options?.includeOther === false) query = query.neq("slug", OTHER_INSTITUTION_SLUG);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapInstitution(row as Record<string, unknown>));
}

export async function getInstitutionById(id: string) {
  const { data, error } = await supabase.from("institutions").select(institutionSelect).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapInstitution(data as Record<string, unknown>) : null;
}

export async function getInstitutionBySlug(slug: string) {
  const { data, error } = await supabase.from("institutions").select(institutionSelect).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? mapInstitution(data as Record<string, unknown>) : null;
}

export function resolveInstitutionDisplayName(institution: Institution | null, manualSchoolName?: string | null) {
  if (institution && institution.slug !== OTHER_INSTITUTION_SLUG) return institution.name;
  return manualSchoolName?.trim() || institution?.name || "Other institution";
}

export function isOtherInstitution(institution: Institution | null | undefined) {
  return !!institution && institution.slug === OTHER_INSTITUTION_SLUG;
}

export type InstitutionSelection = {
  institutionId: string;
  institutionType: InstitutionType | "";
  schoolName: string;
};

export type ResolvedInstitutionFields = {
  institutionId: string | null;
  institutionType: InstitutionType | null;
  schoolName: string | null;
  is1890LandGrant: boolean;
};

const emptyResolvedFields = (): ResolvedInstitutionFields => ({
  institutionId: null,
  institutionType: null,
  schoolName: null,
  is1890LandGrant: false,
});

/** Derive persisted institution fields from a UI selection. Manual/other entries never set 1890. */
export function resolveInstitutionFields(
  institutions: Institution[],
  selection: Partial<InstitutionSelection>,
): ResolvedInstitutionFields {
  if (!selection.institutionId) return emptyResolvedFields();

  const institution = institutions.find((row) => row.id === selection.institutionId) ?? null;
  if (!institution) return emptyResolvedFields();

  if (isOtherInstitution(institution)) {
    return {
      institutionId: institution.id,
      institutionType: selection.institutionType || null,
      schoolName: selection.schoolName?.trim() || null,
      is1890LandGrant: false,
    };
  }

  return {
    institutionId: institution.id,
    institutionType: institution.institutionType,
    schoolName: null,
    is1890LandGrant: institution.is1890LandGrant,
  };
}

export function formatInstitutionTypeLabel(
  institutionType: InstitutionType | null | undefined,
  options?: { admin?: boolean },
) {
  if (!institutionType) return "—";
  const labels = options?.admin ? INSTITUTION_TYPE_ADMIN_LABELS : INSTITUTION_TYPE_LABELS;
  return labels[institutionType];
}

export function format1890Status(is1890: boolean | null | undefined) {
  if (is1890 === true) return "1890 land-grant";
  if (is1890 === false) return "Not 1890 land-grant";
  return "—";
}

export function resolveSchoolDisplayName(options: {
  institution?: Institution | null;
  institutionName?: string | null;
  schoolName?: string | null;
}) {
  if (options.institutionName?.trim()) return options.institutionName.trim();
  if (options.institution && !isOtherInstitution(options.institution)) return options.institution.name;
  return options.schoolName?.trim() || options.institution?.name || "—";
}
