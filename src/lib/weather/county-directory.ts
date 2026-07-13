import type { CountyEmergencyRecord } from "./county-directory-types";

/**
 * Built-in verified county records used when Supabase is unavailable.
 * Do not add fabricated phone numbers — only trusted, reviewed contacts.
 */
export const BUILTIN_VERIFIED_COUNTIES: CountyEmergencyRecord[] = [
  {
    id: "builtin-macon-al",
    countyName: "Macon County",
    stateName: "Alabama",
    stateCode: "AL",
    agencyName: "Macon County Emergency Management Agency",
    primaryPhone: "334-724-2626",
    alternatePhone: null,
    websiteUrl: null,
    alertSignupUrl: null,
    shelterInfoUrl: null,
    weatherRadioGuidance:
      "Keep a NOAA weather radio or reliable local alert app enabled for Macon County.",
    emergencyKitGuidance:
      "Prepare a storm emergency kit: water, medications, flashlight, first aid, and important documents.",
    householdStormProtocol:
      "Agree on a household storm protocol — where to shelter and how to check on neighbors.",
    sourceName: "Macon County Emergency Management Agency",
    sourceUrl: "https://ema.alabama.gov/counties/macon-county/",
    verifiedDate: "2026-07-12",
    verificationStatus: "verified",
    notes: "Built-in verified fallback for Macon County, Alabama.",
    isActive: true,
    archivedAt: null,
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z",
  },
];

/** Placeholder structure for future verified counties — no fabricated records. */
export const FUTURE_COUNTY_DIRECTORY_SLOTS: Array<{
  countyName: string;
  stateCode: string;
  status: "awaiting-verification";
}> = [];

export function normalizeCountyLookupName(countyName: string): string {
  return countyName.toLowerCase().replace(/\s+county$/i, "").trim();
}

export function normalizeStateCode(state?: string): string | null {
  if (!state) return null;
  const trimmed = state.trim().toUpperCase();
  if (trimmed.length === 2) return trimmed;
  if (trimmed === "ALABAMA") return "AL";
  return trimmed.slice(0, 2);
}

export function findBuiltinVerifiedCounty(
  countyName: string,
  state?: string,
): CountyEmergencyRecord | null {
  const county = normalizeCountyLookupName(countyName);
  const stateCode = normalizeStateCode(state);
  return (
    BUILTIN_VERIFIED_COUNTIES.find(
      (record) =>
        normalizeCountyLookupName(record.countyName) === county &&
        (!stateCode || record.stateCode === stateCode),
    ) ?? null
  );
}
