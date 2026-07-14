import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkRateLimit } from "@/lib/weather/rate-limit";

const grantAssistantSchema = z.object({ sourceNotes: z.string().trim().min(40).max(16_000) });

export const generateGrantDraftServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(grantAssistantSchema)
  .handler(async ({ data, context }) => {
    const { data: role, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError) throw roleError;
    if (!role) throw new Error("Forbidden: admin role required.");
    const rateLimit = checkRateLimit(`grant-assistant:${context.userId}`, 5, 60_000);
    if (!rateLimit.allowed) throw new Error("Too many draft requests. Please wait and try again.");

    const [{ supabaseAdmin }, { loadAiProviderConfig }, { generateGrantDraft }] = await Promise.all(
      [
        import("@/integrations/supabase/client.server"),
        import("./server/settings"),
        import("./server/grant-assistant"),
      ],
    );
    const config = await loadAiProviderConfig(supabaseAdmin);
    return generateGrantDraft({
      db: supabaseAdmin,
      userId: context.userId,
      sourceNotes: data.sourceNotes,
      config,
    }).catch((error: unknown) => {
      const name = error instanceof Error ? error.name : "UnknownAiError";
      console.error(`[Grant assistant] Request failed: ${name}`);
      throw new Error(
        name === "AbortError"
          ? "Grant draft generation timed out. Please try again."
          : name === "AiDraftFormatError"
            ? "The AI grant draft could not be validated. Please try again."
            : "Grant draft generation is temporarily unavailable.",
      );
    });
  });
