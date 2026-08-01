import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_registrations",
  title: "List my event registrations",
  description: "List the signed-in user's own JESUP event registrations and their status.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(20).describe("Maximum registrations to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("event_registrations")
      .select("id, status, created_at, checked_in_at, events(id, title, starts_at, location)")
      .eq("user_id", ctx.getUserId() as string)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { registrations: data ?? [] },
    };
  },
});
