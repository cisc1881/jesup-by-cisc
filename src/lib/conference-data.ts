import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export async function saveConferenceSettings(eventId: string, metadata: Record<string, unknown>) {
  const keys = ["conference_shell", "conference_theme", "theme_preset", "brand_label", "map_url", "parking_url", "resource_links", "sections", "community_enabled", "attendee_workspace_enabled", "wallet_enabled", "catalog_enabled", "eventbrite_claim_enabled", "staff_operations_enabled"];
  const { data: event, error: readError } = await supabase.from("events").select("metadata").eq("id", eventId).single();
  if (readError) throw readError;
  const current = event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata) ? event.metadata : {};
  const patch = Object.fromEntries(keys.filter(key => key in metadata).map(key => [key, metadata[key]]));
  const merged = JSON.parse(JSON.stringify({ ...current, ...patch })) as Json;
  let write = supabase.from("events").update({ metadata: merged }).eq("id", eventId);
  write = event.metadata === null ? write.is("metadata", null) : write.eq("metadata", JSON.stringify(event.metadata));
  const { data: saved, error } = await write.select("id");
  if (error) throw error;
  if (!saved?.length) throw new Error("Event settings changed during this save. Reload the event and try again.");
}
