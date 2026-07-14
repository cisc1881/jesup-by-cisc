import type { SupabaseClient } from "@supabase/supabase-js";
import { AiConfigurationError, getAiProviderConfig, type AiProviderConfig } from "./config";

type AdminDb = SupabaseClient;

export type AiRuntimeSettings = {
  enabled: boolean;
  provider: unknown;
};

export function validateAiRuntimeSettings(
  value: unknown,
  env: NodeJS.ProcessEnv = process.env,
): AiProviderConfig {
  if (typeof value !== "object" || value === null) {
    throw new AiConfigurationError("AI settings are missing.");
  }

  const settings = value as Partial<AiRuntimeSettings>;
  if (settings.enabled !== true) {
    throw new AiConfigurationError("Ask JESUP is not enabled.");
  }
  return getAiProviderConfig(settings.provider, env);
}

export async function loadAiProviderConfig(
  db: AdminDb,
  env: NodeJS.ProcessEnv = process.env,
): Promise<AiProviderConfig> {
  const { data, error } = await db
    .from("platform_settings")
    .select("value")
    .eq("key", "ai")
    .single();
  if (error) throw new AiConfigurationError("AI settings could not be loaded.");
  return validateAiRuntimeSettings(data.value, env);
}
