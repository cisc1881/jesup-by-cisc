import { supabase } from "@/integrations/supabase/client";
import { triggerEmailDelivery } from "@/lib/email-delivery";

export type EmailDeliveryStatus = "pending" | "processing" | "sent" | "failed";

export async function listEmailDeliveries(status?: EmailDeliveryStatus) {
  let query = supabase
    .from("email_deliveries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function retryEmailDelivery(id: string) {
  const { error } = await supabase
    .from("email_deliveries")
    .update({
      status: "pending",
      attempts: 0,
      last_error: null,
      next_attempt_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  triggerEmailDelivery();
}

export async function retryFailedEmailDeliveries() {
  const { error } = await supabase
    .from("email_deliveries")
    .update({
      status: "pending",
      attempts: 0,
      last_error: null,
      next_attempt_at: new Date().toISOString(),
    })
    .eq("status", "failed");
  if (error) throw error;
  triggerEmailDelivery();
}
