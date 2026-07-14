import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
      starterPartners,
      starterPodcasts,
      starterInternships,
    } = await import("./starter-content");
    const imports = [
      ["programs", starterPrograms],
      ["events", starterEvents],
      ["news_articles", starterNews],
      ["markets", starterMarkets],
      ["partners", starterPartners],
      ["podcast_episodes", starterPodcasts],
      ["internships", starterInternships],
    ] as const;
    const result: Record<string, number> = {};
    for (const [table, rows] of imports) {
      const { data, error } = await context.supabase
        .from(table)
        .upsert(rows, { onConflict: "slug" })
        .select("id");
      if (error) throw new Error(`${table}: ${error.message}`);
      result[table] = data?.length ?? 0;
    }

    const { error: retiredProgramsError } = await context.supabase
      .from("programs")
      .update({ is_active: false, is_featured: false })
      .in("slug", ["black-belt-food-corridor", "2fas"]);
    if (retiredProgramsError) {
      throw new Error(`programs cleanup: ${retiredProgramsError.message}`);
    }

    return result;
  });
