import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseCtx = SupabaseClient<Database>;

type DynUpsertResult = { data: { id: string }[] | null; error: { message: string } | null };
interface DynUpsertBuilder extends PromiseLike<DynUpsertResult> {
  select: (cols: string) => DynUpsertBuilder;
}
interface DynUpsertFrom {
  upsert: (rows: Record<string, unknown>[], opts: { onConflict: string }) => DynUpsertBuilder;
}

async function upsertStarterRows<Table extends keyof Database["public"]["Tables"]>(
  supabase: SupabaseCtx,
  table: Table,
  rows: Database["public"]["Tables"][Table]["Insert"][],
): Promise<number> {
  const client = supabase as unknown as { from: (table: Table) => DynUpsertFrom };
  const { data, error } = await client
    .from(table)
    .upsert(rows as unknown as Record<string, unknown>[], { onConflict: "slug" })
    .select("id");
  if (error) throw new Error(`${table}: ${error.message}`);
  return data?.length ?? 0;
}

export const importStarterContentServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError) throw roleError;
    if (!role) throw new Error("Forbidden: admin role required.");

    const {
      starterPrograms,
      starterEvents,
      starterNews,
      starterMarkets,
      starterPodcasts,
      starterInternships,
    } = await import("./starter-content");
    // The official partner roster and supplied brand assets are managed separately
    // so a starter-content refresh cannot overwrite approved logos or republish placeholders.
    const result: Record<string, number> = {};
    result.programs = await upsertStarterRows(context.supabase, "programs", starterPrograms);
    result.events = await upsertStarterRows(context.supabase, "events", starterEvents);
    result.news_articles = await upsertStarterRows(context.supabase, "news_articles", starterNews);
    result.markets = await upsertStarterRows(context.supabase, "markets", starterMarkets);
    result.podcast_episodes = await upsertStarterRows(context.supabase, "podcast_episodes", starterPodcasts);
    result.internships = await upsertStarterRows(context.supabase, "internships", starterInternships);

    const { error: retiredProgramsError } = await context.supabase
      .from("programs")
      .update({ is_active: false, is_featured: false })
      .in("slug", ["black-belt-food-corridor", "2fas"]);
    if (retiredProgramsError) {
      throw new Error(`programs cleanup: ${retiredProgramsError.message}`);
    }

    return result;
  });
