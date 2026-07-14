import type { CountyEmergencyRecord } from "./county-directory-types";
import {
  findBuiltinVerifiedCounty,
  normalizeCountyLookupName,
  normalizeStateCode,
} from "./county-directory";
import { getWeatherCache, normalizeCacheKey } from "./cache-factory";
import { SERVER_CACHE_TTL } from "./constants";
import type { CountyPreparedness } from "./types";

const GENERIC_GUIDANCE = [
  "Keep a NOAA weather radio or trusted local alert app enabled.",
  "Maintain battery backup for phones, radios, and essential medical devices.",
  "Prepare a storm emergency kit: water, medications, flashlight, first aid, and important documents.",
  "Agree on a household storm protocol — where to shelter and how to check on neighbors.",
  "Pay special attention to very young children, older adults, and those with mobility needs.",
  "For life-threatening emergencies, call 911.",
] as const;

function mapDbRow(row: Record<string, unknown>): CountyEmergencyRecord {
  return {
    id: row.id as string,
    countyName: row.county_name as string,
    stateName: row.state_name as string,
    stateCode: row.state_code as string,
    agencyName: row.agency_name as string,
    primaryPhone: (row.primary_phone as string | null) ?? null,
    alternatePhone: (row.alternate_phone as string | null) ?? null,
    websiteUrl: (row.website_url as string | null) ?? null,
    alertSignupUrl: (row.alert_signup_url as string | null) ?? null,
    shelterInfoUrl: (row.shelter_info_url as string | null) ?? null,
    weatherRadioGuidance: (row.weather_radio_guidance as string | null) ?? null,
    emergencyKitGuidance: (row.emergency_kit_guidance as string | null) ?? null,
    householdStormProtocol: (row.household_storm_protocol as string | null) ?? null,
    sourceName: (row.source_name as string | null) ?? null,
    sourceUrl: (row.source_url as string | null) ?? null,
    verifiedDate: row.verified_date ? String(row.verified_date) : null,
    verificationStatus: row.verification_status as CountyEmergencyRecord["verificationStatus"],
    notes: (row.notes as string | null) ?? null,
    isActive: Boolean(row.is_active),
    archivedAt: (row.archived_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function mapCountyRecordToPreparedness(record: CountyEmergencyRecord): CountyPreparedness {
  const isVerified = record.verificationStatus === "verified" && record.isActive && !record.archivedAt;
  const guidance = [
    record.weatherRadioGuidance,
    record.emergencyKitGuidance,
    record.householdStormProtocol,
    "Pay special attention to very young children, older adults, and those with mobility needs.",
    isVerified
      ? "Contact local authorities if you need non-emergency assistance during extended outages."
      : "For life-threatening emergencies, call 911.",
  ].filter((item): item is string => Boolean(item));

  const displayCounty = record.countyName.toLowerCase().includes("county")
    ? record.countyName
    : `${record.countyName} County`;

  return {
    countyName: displayCounty,
    agencyName: record.agencyName,
    phone: isVerified ? record.primaryPhone : null,
    alternatePhone: isVerified ? record.alternatePhone : null,
    websiteUrl: isVerified ? record.websiteUrl : null,
    alertSignupUrl: isVerified ? record.alertSignupUrl : null,
    shelterInfoUrl: isVerified ? record.shelterInfoUrl : null,
    guidance,
    contactAvailable: isVerified && Boolean(record.primaryPhone),
    verificationStatus: isVerified ? "verified" : "generic",
    sourceName: isVerified ? record.sourceName ?? undefined : undefined,
    sourceUrl: isVerified ? record.sourceUrl ?? undefined : undefined,
    verifiedDate: isVerified ? record.verifiedDate ?? undefined : undefined,
    lastReviewedLabel: isVerified && record.verifiedDate
      ? `Last reviewed ${record.verifiedDate}`
      : undefined,
  };
}

function buildGenericPreparedness(countyName: string): CountyPreparedness {
  const displayCounty = countyName.toLowerCase().includes("county") ? countyName : `${countyName} County`;

  return {
    countyName: displayCounty,
    agencyName: "Local emergency management",
    phone: null,
    guidance: [...GENERIC_GUIDANCE],
    contactAvailable: false,
    verificationStatus: "generic",
  };
}

async function fetchVerifiedCountyFromDatabase(
  countyName: string,
  state?: string,
): Promise<CountyEmergencyRecord | null> {
  const stateCode = normalizeStateCode(state);
  const cacheKey = normalizeCacheKey([
    "county-directory",
    normalizeCountyLookupName(countyName),
    stateCode ?? "unknown",
  ]);

  const cache = getWeatherCache();
  const cached = await cache.get<CountyEmergencyRecord | null>(cacheKey);
  if (cached) return cached;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const countyContacts = (supabaseAdmin as unknown as {
      from: (table: string) => ReturnType<typeof supabaseAdmin.from>;
    }).from("county_emergency_contacts");

    let query = countyContacts
      .select("*")
      .eq("verification_status", "verified")
      .eq("is_active", true)
      .is("archived_at", null)
      .ilike("county_name", countyName)
      .limit(1);

    if (stateCode) query = query.eq("state_code", stateCode);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    const mapped = data ? mapDbRow(data as Record<string, unknown>) : null;
    await cache.set(cacheKey, mapped, { ttlMs: SERVER_CACHE_TTL.countyDirectory ?? 12 * 60 * 60_000 });
    return mapped;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[county-directory] Supabase lookup failed; using built-in/generic fallback", error);
    }
    return null;
  }
}

export async function resolveCountyPreparedness(
  countyName: string,
  state?: string,
): Promise<CountyPreparedness> {
  const fromDatabase = await fetchVerifiedCountyFromDatabase(countyName, state);
  if (fromDatabase) return mapCountyRecordToPreparedness(fromDatabase);

  const builtin = findBuiltinVerifiedCounty(countyName, state);
  if (builtin) return mapCountyRecordToPreparedness(builtin);

  return buildGenericPreparedness(countyName);
}

export function isPublicCountyRecord(record: CountyEmergencyRecord): boolean {
  return (
    record.verificationStatus === "verified" &&
    record.isActive &&
    !record.archivedAt &&
    Boolean(record.primaryPhone)
  );
}
