import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { curatedMarketIdentity } from "../../curated-content-images";

export default defineTool({
  name: "list_markets",
  title: "List farmers markets",
  description:
    "List active farmers markets in the JESUP network with location, hours, season and payment options.",
  inputSchema: {
    city: z.string().trim().min(1).max(80).optional().describe("Filter markets by city name."),
    limit: z.number().int().min(1).max(50).default(10).describe("Maximum markets to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ city, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("markets")
      .select(
        "id, name, description, address, city, state, hours, season, accepts_snap_ebt, accepts_credit, website_url",
      )
      .eq("is_active", true)
      .order("name", { ascending: true })
      .limit(limit ?? 10);
    if (city) query = query.ilike("city", `%${city}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const markets = (data ?? []).map((market) => ({
      ...market,
      name: curatedMarketIdentity(market).name,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(markets) }],
      structuredContent: { markets },
    };
  },
});
