import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "register_for_event",
  title: "Register for an event",
  description:
    "Register the signed-in user for a JESUP event by event id. Capacity and registration rules are enforced by the server.",
  inputSchema: {
    event_id: z.string().uuid().describe("The id of the event to register for."),
    notes: z.string().trim().max(500).optional().describe("Optional note for the organizers."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ event_id, notes }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("event_registrations")
      .insert({ event_id, user_id: ctx.getUserId() as string, notes: notes ?? null })
      .select("id, event_id, status, ticket_code, created_at")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { registration: data },
    };
  },
});
