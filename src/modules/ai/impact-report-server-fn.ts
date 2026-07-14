import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkRateLimit } from "@/lib/weather/rate-limit";

const schema = z.object({ metricsContext: z.string().min(20).max(20_000) });

export const generateImpactReportServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(schema)
  .handler(async ({ data, context }) => {
    const { data: role, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw error;
    if (!role) throw new Error("Forbidden: admin role required.");
    if (!checkRateLimit(`impact-report-generator:${context.userId}`, 5, 60_000).allowed) {
      throw new Error("Too many report requests. Please wait and try again.");
    }

    const [{ supabaseAdmin }, { loadAiProviderConfig }, { generateImpactReportNarrative }] =
      await Promise.all([
        import("@/integrations/supabase/client.server"),
        import("./server/settings"),
        import("./server/impact-report"),
      ]);
    const config = await loadAiProviderConfig(supabaseAdmin);
    return generateImpactReportNarrative({
      db: supabaseAdmin,
      userId: context.userId,
      metricsContext: data.metricsContext,
      config,
    }).catch((caught: unknown) => {
      const name = caught instanceof Error ? caught.name : "UnknownAiError";
      console.error(`[Impact report generator] Request failed: ${name}`);
      throw new Error(
        name === "AbortError"
          ? "Impact report generation timed out. Please try again."
          : name === "AiImpactFormatError"
            ? "The AI report narrative could not be validated. Please try again."
            : "Impact report generation is temporarily unavailable.",
      );
    });
  });
