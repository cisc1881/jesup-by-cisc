import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export async function saveConferenceSettings(eventId: string, metadata: Record<string, unknown>) {
  const { error } = await supabase.from("events").update({ metadata: JSON.parse(JSON.stringify(metadata)) as Json }).eq("id", eventId);
  if (error) throw error;
}
