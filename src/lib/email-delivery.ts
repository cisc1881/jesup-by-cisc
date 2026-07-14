import { supabase } from "@/integrations/supabase/client";

/** Wake the delivery worker without making submission success depend on email. */
export function triggerEmailDelivery() {
  void supabase.functions.invoke("process-email-queue").catch(() => undefined);
}
