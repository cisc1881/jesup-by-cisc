import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { syncOneEvent, type EventSyncReport } from "./eventbrite-api-sync";

/** Admin-only live sync. Every write goes through import_eventbrite_registrations
 * as the signed-in admin, so the CSV importer's protections and audit apply. */
export const syncEventbriteRegistrationsServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase;
    const { data: admin, error: roleError } = await db.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !admin) throw new Error("Forbidden: admin role required.");

    const token = process.env["EVENTBRITE_PRIVATE_TOKEN"]?.trim();
    if (!token) throw new Error("Eventbrite API sync is not configured yet. Use the Eventbrite CSV import in Conference operations.");

    const { data: events, error } = await db.from("events").select("id, title, metadata").eq("is_active", true);
    if (error) throw new Error("Could not load events.");

    const reports: EventSyncReport[] = [];
    for (const event of events ?? []) {
      const metadata = (event.metadata ?? {}) as Record<string, unknown>;
      if (metadata.registration_provider !== "eventbrite") continue;
      const eventbriteEventId = String(metadata.eventbrite_event_id ?? "").trim();
      if (!eventbriteEventId) continue;
      const report = await syncOneEvent(
        { id: event.id, title: event.title, eventbriteEventId },
        {
          token,
          fetch: (url, init) => fetch(url, init),
          rpc: async (args) => {
            const { data, error } = await db.rpc("import_eventbrite_registrations", { ...args, p_rows: args.p_rows as unknown as Json });
            return { data, error: error ? { message: error.message } : null };
          },
          setTicketClasses: async (rows) => {
            const { error } = await db.rpc("set_eventbrite_ticket_classes", { p_event_id: event.id, p_rows: rows as unknown as Json });
            if (error) console.error("Eventbrite ticket class update failed for event", event.id, error.code);
          },
        },
      );
      if (!report.ok) console.error("Eventbrite sync failed for event", event.id, report.error);
      reports.push(report);
    }
    const sum = (k: "new" | "update") => reports.reduce((n, r) => n + (r.counts?.[k] ?? 0), 0);
    return { linkedEvents: reports.length, imported: sum("new"), updated: sum("update"), failed: reports.filter((r) => !r.ok).length, reports };
  });
