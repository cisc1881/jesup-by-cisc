import type { CountyPreparedness } from "./types";

const GENERIC_GUIDANCE = [
  "Keep a NOAA weather radio or trusted local alert app enabled.",
  "Maintain battery backup for phones, radios, and essential medical devices.",
  "Prepare a storm emergency kit: water, medications, flashlight, first aid, and important documents.",
  "Agree on a household storm protocol — where to shelter and how to check on neighbors.",
  "Pay special attention to very young children, older adults, and those with mobility needs.",
  "For life-threatening emergencies, call 911.",
] as const;

export const MACON_COUNTY_PREPAREDNESS: CountyPreparedness = {
  countyName: "Macon County",
  agencyName: "Macon County Emergency Management Agency",
  phone: "334-724-2626",
  contactAvailable: true,
  verificationStatus: "verified",
  sourceName: "Macon County Emergency Management Agency",
  sourceUrl: "https://ema.alabama.gov/counties/macon-county/",
  verifiedDate: "2026-07-12",
  lastReviewedLabel: "Last reviewed 2026-07-12",
  guidance: [
    "Keep a NOAA weather radio or reliable local alert app enabled for Macon County.",
    "Maintain battery backup for phones, radios, and essential medical devices.",
    "Know common seasonal trends: summer heat, afternoon thunderstorms, and occasional severe wind.",
    "Prepare a storm emergency kit: water, medications, flashlight, first aid, and important documents.",
    "Agree on a household storm protocol — where to shelter and how to check on neighbors.",
    "Pay special attention to very young children, older adults, and those with mobility needs.",
    "Contact local authorities if you need non-emergency assistance during extended outages.",
  ],
};

export function isMaconCountyAlabama(countyName: string, state?: string): boolean {
  const normalizedCounty = countyName.toLowerCase().replace(/\s+county$/i, "").trim();
  const normalizedState = (state ?? "").toUpperCase();
  return normalizedCounty === "macon" && (normalizedState === "AL" || normalizedState === "ALABAMA");
}

/** Sync fallback for client-side display when live weather fails. */
export function buildCountyPreparedness(countyName: string, state?: string): CountyPreparedness {
  if (isMaconCountyAlabama(countyName, state)) {
    return MACON_COUNTY_PREPAREDNESS;
  }

  const displayCounty = countyName.toLowerCase().includes("county") ? countyName : `${countyName} County`;

  return {
    countyName: displayCounty,
    agencyName: "Local emergency management",
    phone: null,
    contactAvailable: false,
    verificationStatus: "generic",
    guidance: [...GENERIC_GUIDANCE],
  };
}
