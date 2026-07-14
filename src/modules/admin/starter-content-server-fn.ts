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

    const { starterPrograms, starterEvents, starterNews, starterMarkets, starterPartners } =
      await import("./starter-content");
    const imports = [
      ["programs", starterPrograms],
      ["events", starterEvents],
      ["news_articles", starterNews],
      ["markets", starterMarkets],
      ["partners", starterPartners],
    ] as const;
    const result: Record<string, number> = {};
    for (const [table, rows] of imports) {
      const { data, error } = await context.supabase
        .from(table)
        .upsert(rows, { onConflict: "slug", ignoreDuplicates: true })
        .select("id");
      if (error) throw new Error(`${table}: ${error.message}`);
      result[table] = data?.length ?? 0;
    }
    return result;
  });
