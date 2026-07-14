import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkRateLimit } from "@/lib/weather/rate-limit";

const askJESUPSchema = z.object({
  question: z.string().trim().min(2, "Question is too short.").max(240, "Question is too long."),
  history: z
    .array(
      z.discriminatedUnion("role", [
        z.object({ role: z.literal("user"), content: z.string().trim().min(1).max(240) }),
        z.object({ role: z.literal("assistant"), content: z.string().trim().min(1).max(2_000) }),
      ]),
    )
    .max(6)
    .default([]),
});

const ASK_RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 };

export const askJESUPServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(askJESUPSchema)
  .handler(async ({ data, context }) => {
    const rateLimit = checkRateLimit(
      `ask-jesup:${context.userId}`,
      ASK_RATE_LIMIT.maxRequests,
      ASK_RATE_LIMIT.windowMs,
    );
    if (!rateLimit.allowed) {
      throw new Error(
        `Too many Ask JESUP requests. Try again in ${Math.ceil((rateLimit.retryAfterMs ?? 60_000) / 1000)} seconds.`,
      );
    }

    const [{ supabaseAdmin }, { loadAiProviderConfig }, { executeJESUPRequest }] =
      await Promise.all([
        import("@/integrations/supabase/client.server"),
        import("./server/settings"),
        import("./server/execute"),
      ]);
    const config = await loadAiProviderConfig(supabaseAdmin);
    const result = await executeJESUPRequest({
      db: supabaseAdmin,
      userId: context.userId,
      question: data.question,
      history: data.history,
      config,
    }).catch((error: unknown) => {
      const errorName = error instanceof Error ? error.name : "UnknownAiError";
      console.error(`[Ask JESUP] Request failed: ${errorName}`);
      throw new Error(
        errorName === "AbortError"
          ? "Ask JESUP timed out. Please try again."
          : "Ask JESUP is temporarily unavailable. Please try again later.",
      );
    });

    return { answer: result.content, sources: result.context.sources };
  });
