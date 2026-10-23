import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EVENTBRITE_IMPORT_MAX_BYTES, parseEventbriteCsv, sha256Hex, ticketClassRows } from "./eventbrite-import";

const input = z.object({
  eventId: z.string().uuid(),
  requestId: z.string().uuid(),
  csv: z.string().min(1).max(EVENTBRITE_IMPORT_MAX_BYTES),
  commit: z.boolean(),
});

type Counts = Record<"new" | "update" | "duplicate" | "conflict" | "cancelled" | "invalid", number>;
type Issue = { line: number; outcome: string; reason: string };

/** Admin-only Eventbrite attendee CSV import. Returns counts and line numbers only — no attendee data. */
export const importEventbriteCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(input)
  .handler(async ({ data, context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !admin) throw new Error("Administrator required");
    const parsed = parseEventbriteCsv(data.csv);
    if (!parsed.ok) throw new Error(parsed.error);
    const { data: result, error } = await context.supabase.rpc("import_eventbrite_registrations", {
      p_event_id: data.eventId,
      p_request_id: data.requestId,
      p_rows: parsed.rows,
      p_dry_run: !data.commit,
      p_file_sha256: await sha256Hex(data.csv),
    });
    if (error) {
      console.error("Eventbrite CSV import failed", error.code);
      throw new Error(error.message.includes("capacity") ? "Import stopped: event capacity reached. Nothing was saved." : "Import failed. Nothing was saved.");
    }
    const classes = data.commit ? ticketClassRows(parsed.rows) : [];
    if (classes.length) {
      const { error: classError } = await context.supabase.rpc("set_eventbrite_ticket_classes", { p_event_id: data.eventId, p_rows: classes });
      if (classError) console.error("Eventbrite ticket class update failed", classError.code);
    }
    const r = result as { counts: Counts; issues?: Issue[]; replayed?: boolean; rows: number };
    const counts = { ...r.counts, invalid: (r.counts.invalid ?? 0) + parsed.issues.length };
    const issues = [...parsed.issues, ...(r.issues ?? [])].sort((a, b) => a.line - b.line).slice(0, 500);
    return {
      committed: data.commit,
      replayed: Boolean(r.replayed),
      totalRows: parsed.rows.length + parsed.issues.length,
      valid: parsed.rows.length,
      counts,
      issues,
      ignoredColumns: parsed.ignoredColumns,
    };
  });
