import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkRateLimit } from "@/lib/weather/rate-limit";

const factsheetSchema = z.object({
  topic: z.string().trim().min(3).max(160),
  researchNotes: z.string().trim().min(40).max(12_000),
});

export const generateFactsheetServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(factsheetSchema)
  .handler(async ({ data, context }) => {
    const { data: role, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError) throw roleError;
    if (!role) throw new Error("Forbidden: admin role required.");

    const rateLimit = checkRateLimit(`factsheet-generator:${context.userId}`, 5, 60_000);
    if (!rateLimit.allowed) throw new Error("Too many draft requests. Please wait and try again.");

    const [{ supabaseAdmin }, { loadAiProviderConfig }, { generateFactsheetDraft }] =
      await Promise.all([
        import("@/integrations/supabase/client.server"),
        import("./server/settings"),
        import("./server/factsheet"),
      ]);
    const config = await loadAiProviderConfig(supabaseAdmin);
    return generateFactsheetDraft({
      db: supabaseAdmin,
      userId: context.userId,
      topic: data.topic,
      researchNotes: data.researchNotes,
      config,
    }).catch((error: unknown) => {
      const name = error instanceof Error ? error.name : "UnknownAiError";
      console.error(`[Factsheet generator] Request failed: ${name}`);
      throw new Error(
        name === "AbortError"
          ? "Factsheet generation timed out. Please try again."
          : name === "AiDraftFormatError"
            ? "The AI draft could not be validated. Please try again."
            : "Factsheet generation is temporarily unavailable.",
      );
    });
  });
