import type { Json } from "@/integrations/supabase/types";

export type InternshipAudience = {
  institutionIds: string[];
  institutionSlugs: string[];
  networkWide: boolean;
  otherInstitutions: boolean;
};

export function parseInternshipAudience(
  metadata: Json | null | undefined,
  options: { is2fas?: boolean } = {},
): InternshipAudience {
  const record =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};
  const institutionIds = Array.isArray(record.institution_ids)
    ? record.institution_ids.filter((value): value is string => typeof value === "string")
    : [];
  const institutionSlugs = Array.isArray(record.institution_slugs)
    ? record.institution_slugs.filter((value): value is string => typeof value === "string")
    : [];
  const hasExplicitAudience =
    record.network_wide !== undefined ||
    record.other_institutions !== undefined ||
    institutionIds.length > 0 ||
    institutionSlugs.length > 0;

  // Production installations created before the audience migration do not
  // have internships.metadata yet. Keep 2FAS Tuskegee-only in that legacy
  // state while treating ordinary opportunities as network-wide.
  if (!hasExplicitAudience && options.is2fas) {
    return {
      institutionIds: [],
      institutionSlugs: ["tuskegee-university"],
      networkWide: false,
      otherInstitutions: false,
    };
  }

  return {
    institutionIds,
    institutionSlugs,
    networkWide:
      record.network_wide === true ||
      (institutionIds.length === 0 &&
        institutionSlugs.length === 0 &&
        record.other_institutions !== true),
    otherInstitutions: record.other_institutions === true,
  };
}
