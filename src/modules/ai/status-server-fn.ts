import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AiProvider = "openai" | "anthropic";

export type AiConfigurationStatus = {
  enabled: boolean;
  provider: AiProvider | null;
  configured: boolean;
  model: string | null;
  issue: string | null;
};

function isAiProvider(value: unknown): value is AiProvider {
  return value === "openai" || value === "anthropic";
}

async function assertAdmin(db: SupabaseClient, userId: string): Promise<void> {
  const { data, error } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Forbidden: admin role required.");
}

export const getAiConfigurationStatusServerFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "ai")
      .single();
    if (error) throw new Error("AI settings could not be loaded.");

    const value = typeof data.value === "object" && data.value !== null ? data.value : {};
    const enabled = "enabled" in value && value.enabled === true;
    const providerValue = "provider" in value ? value.provider : null;
    const provider = isAiProvider(providerValue) ? providerValue : null;
    const keyConfigured =
      provider === "openai"
        ? Boolean(process.env.OPENAI_API_KEY?.trim())
        : provider === "anthropic"
          ? Boolean(process.env.ANTHROPIC_API_KEY?.trim())
          : false;
    const model =
      provider === "openai"
        ? process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini"
        : provider === "anthropic"
          ? process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-20250514"
          : null;

    let issue: string | null = null;
    if (!enabled) issue = "AI services are disabled.";
    else if (!provider) issue = "Select a supported AI provider.";
    else if (!keyConfigured)
      issue = `${provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"} is not configured on the server.`;

    return { enabled, provider, configured: enabled && keyConfigured, model, issue };
  });
