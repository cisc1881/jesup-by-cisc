import { supabase } from "@/integrations/supabase/client";
import type {
  CountyEmergencyFormData,
  CountyEmergencyListItem,
  CountyEmergencyRecord,
  CountyVerificationStatus,
} from "@/lib/weather/county-directory-types";
import { mapCountyRecordToPreparedness } from "@/lib/weather/county-directory-service";

// Table added in 20260712160000_county_emergency_contacts.sql — regenerate Supabase types after migration.
function countyTable() {
  return (supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> }).from(
    "county_emergency_contacts",
  );
}

function mapRow(row: Record<string, unknown>): CountyEmergencyRecord {
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
    verificationStatus: row.verification_status as CountyVerificationStatus,
    notes: (row.notes as string | null) ?? null,
    isActive: Boolean(row.is_active),
    archivedAt: (row.archived_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapListRow(row: Record<string, unknown>): CountyEmergencyListItem {
  const record = mapRow(row);
  return {
    id: record.id,
    countyName: record.countyName,
    stateName: record.stateName,
    stateCode: record.stateCode,
    agencyName: record.agencyName,
    primaryPhone: record.primaryPhone,
    verificationStatus: record.verificationStatus,
    verifiedDate: record.verifiedDate,
    isActive: record.isActive,
    archivedAt: record.archivedAt,
    updatedAt: record.updatedAt,
  };
}

export function emptyCountyEmergencyForm(): CountyEmergencyFormData {
  return {
    countyName: "",
    stateName: "",
    stateCode: "",
    agencyName: "",
    primaryPhone: "",
    alternatePhone: "",
    websiteUrl: "",
    alertSignupUrl: "",
    shelterInfoUrl: "",
    weatherRadioGuidance: "",
    emergencyKitGuidance: "",
    householdStormProtocol: "",
    sourceName: "",
    sourceUrl: "",
    verifiedDate: "",
    verificationStatus: "pending",
    notes: "",
    isActive: true,
  };
}

export async function fetchAdminCountyEmergencyContacts(): Promise<CountyEmergencyListItem[]> {
  const { data, error } = await countyTable()
    .select(
      "id, county_name, state_name, state_code, agency_name, primary_phone, verification_status, verified_date, is_active, archived_at, updated_at",
    )
    .order("state_code")
    .order("county_name");

  if (error) throw error;
  return (data ?? []).map((row) => mapListRow(row as Record<string, unknown>));
}

export async function fetchCountyEmergencyContact(id: string): Promise<CountyEmergencyRecord> {
  const { data, error } = await countyTable().select("*").eq("id", id).single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function saveCountyEmergencyContact(
  id: string | null,
  form: CountyEmergencyFormData,
): Promise<string> {
  const payload = {
    county_name: form.countyName.trim(),
    state_name: form.stateName.trim(),
    state_code: form.stateCode.trim().toUpperCase(),
    agency_name: form.agencyName.trim(),
    primary_phone: form.primaryPhone.trim() || null,
    alternate_phone: form.alternatePhone.trim() || null,
    website_url: form.websiteUrl.trim() || null,
    alert_signup_url: form.alertSignupUrl.trim() || null,
    shelter_info_url: form.shelterInfoUrl.trim() || null,
    weather_radio_guidance: form.weatherRadioGuidance.trim() || null,
    emergency_kit_guidance: form.emergencyKitGuidance.trim() || null,
    household_storm_protocol: form.householdStormProtocol.trim() || null,
    source_name: form.sourceName.trim() || null,
    source_url: form.sourceUrl.trim() || null,
    verified_date: form.verifiedDate || null,
    verification_status: form.verificationStatus,
    notes: form.notes.trim() || null,
    is_active: form.isActive,
    archived_at: form.isActive ? null : new Date().toISOString(),
  };

  if (id) {
    const { error } = await countyTable().update(payload).eq("id", id);
    if (error) throw error;
    return id;
  }

  const { data, error } = await countyTable().insert(payload).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function archiveCountyEmergencyContact(id: string): Promise<void> {
  const { error } = await countyTable()
    .update({ is_active: false, archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export function previewCountyEmergencyCard(record: CountyEmergencyRecord) {
  return mapCountyRecordToPreparedness(record);
}
