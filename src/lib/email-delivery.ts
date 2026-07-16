import { supabase } from "@/integrations/supabase/client";

export async function processEmailDeliveryQueue() {
  const { data, error } = await supabase.functions.invoke("process-email-queue");
  if (error) {
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      try {
        const payload = await context.json() as { error?: string };
        if (payload.error) throw new Error(payload.error);
      } catch (contextError) {
        if (contextError instanceof Error && contextError !== error) throw contextError;
      }
    }
    throw error;
  }
  return data as { claimed?: number; sent?: number; failed?: number } | null;
}

/** Wake the delivery worker without making submission success depend on email. */
export function triggerEmailDelivery() {
  void processEmailDeliveryQueue().catch(() => undefined);
}
