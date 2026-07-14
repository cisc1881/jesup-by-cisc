import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkRateLimit } from "@/lib/weather/rate-limit";
import { sanitizeSurveyCsv } from "./survey-csv";

const summarySchema = z.object({
  surveyTitle: z.string().trim().min(3).max(160),
  csvText: z.string().min(10).max(100_000),
});

export const summarizeSurveyServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(summarySchema)
  .handler(async ({ data, context }) => {
    const { data: role, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw error;
    if (!role) throw new Error("Forbidden: admin role required.");
    if (!checkRateLimit(`survey-summarizer:${context.userId}`, 5, 60_000).allowed) {
      throw new Error("Too many summary requests. Please wait and try again.");
    }

    const sanitized = sanitizeSurveyCsv(data.csvText);
    const [{ supabaseAdmin }, { loadAiProviderConfig }, { generateSurveySummary }] =
      await Promise.all([
        import("@/integrations/supabase/client.server"),
        import("./server/settings"),
        import("./server/survey-summary"),
      ]);
    const config = await loadAiProviderConfig(supabaseAdmin);
    const summary = await generateSurveySummary({
      db: supabaseAdmin,
      userId: context.userId,
      surveyTitle: data.surveyTitle,
      sanitizedResponses: sanitized.content,
      responseCount: sanitized.rowCount,
      config,
    }).catch((caught: unknown) => {
      const name = caught instanceof Error ? caught.name : "UnknownAiError";
      console.error(`[Survey summarizer] Request failed: ${name}`);
      throw new Error(
        name === "AbortError"
          ? "Survey summarization timed out. Please try again."
          : name === "AiSummaryFormatError"
            ? "The AI summary could not be validated. Please try again."
            : "Survey summarization is temporarily unavailable.",
      );
    });
    return {
      summary,
      privacy: {
        responseCount: sanitized.rowCount,
        excludedColumns: sanitized.excludedColumns,
        truncated: sanitized.truncated,
      },
    };
  });
