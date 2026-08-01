import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_events",
  title: "List JESUP events",
  description:
    "List upcoming JESUP events (workshops, field days, community programs) with dates, locations and registration status.",
  inputSchema: {
    search: z.string().trim().min(1).max(100).optional().describe("Filter events by title text."),
    limit: z.number().int().min(1).max(50).default(10).describe("Maximum events to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("events")
      .select(
        "id, title, description, starts_at, ends_at, location, capacity, registration_open, registration_status, status",
      )
      .eq("is_active", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(limit ?? 10);
    if (search) query = query.ilike("title", `%${search}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { events: data ?? [] },
    };
  },
});
