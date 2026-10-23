import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { mappingInput, summarizeTicketClasses } from "./ticket-mapping";

const eventInput = z.object({ eventId: z.string().uuid() });

async function requireAdmin(db: { rpc: (...a: never[]) => unknown }, userId: string) {
  const { data, error } = await (db.rpc as unknown as (n: string, a: object) => Promise<{ data: unknown; error: unknown }>)("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new Error("Administrator required");
}

/** Admin-only: distinct ticket classes with counts (no attendee data) plus current mappings. */
export const readTicketMappings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(eventInput)
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    await requireAdmin(db as never, context.userId);
    const [regs, maps] = await Promise.all([
      db.from("event_registrations").select("eventbrite_ticket_class,status").eq("event_id", data.eventId).eq("registration_source", "eventbrite"),
      db.from("event_ticket_mappings").select("id,ticket_class,product_id,quantity").eq("event_id", data.eventId).order("ticket_class"),
    ]);
    if (regs.error || maps.error) throw new Error("Could not load ticket mappings");
    return { classes: summarizeTicketClasses(regs.data ?? []), mappings: maps.data ?? [] };
  });

export const saveTicketMapping = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(mappingInput)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("save_event_ticket_mapping", {
      p_event_id: data.eventId, p_ticket_class: data.ticketClass, p_product_id: data.productId, p_quantity: data.quantity, p_remove: data.remove,
    });
    if (error) throw new Error(error.message);
    return { saved: true };
  });

export const issueMappedCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ eventId: z.string().uuid(), requestId: z.string().uuid(), commit: z.boolean(), allowUnpriced: z.boolean() }))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("issue_mapped_entitlements", {
      p_event_id: data.eventId, p_request_id: data.requestId, p_dry_run: !data.commit, p_allow_unpriced: data.allowUnpriced,
    });
    if (error) throw new Error(/capacity/i.test(error.message) ? "Stopped: a product's capacity would be exceeded. Nothing was issued." : error.message);
    return result as Record<string, number | boolean>;
  });
