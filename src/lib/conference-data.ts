import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export async function saveConferenceSettings(eventId: string, metadata: Record<string, unknown>) {
  const { error } = await supabase.from("events").update({ metadata: JSON.parse(JSON.stringify(metadata)) as Json }).eq("id", eventId);
  if (error) throw error;
}

export async function claimEventbriteTicket(eventId: string) {
  const { data, error } = await supabase.rpc("claim_eventbrite_registration", { p_event_id: eventId });
  if (error) throw error;
  return data;
}

export async function fetchMyEventWallet(eventId: string, registrationId: string) {
  const { data, error } = await supabase.from("event_entitlements")
    .select("id, credential_code, status, quantity, beneficiary_name, valid_from, valid_until, event_products(name, kind), event_entitlement_redemptions(id)")
    .eq("event_id", eventId).eq("registration_id", registrationId);
  if (error) throw error;
  return data ?? [];
}