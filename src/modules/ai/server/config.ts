export type AiProvider = "openai" | "anthropic";

export type AiProviderConfig = {
  provider: AiProvider;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
};

export class AiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigurationError";
  }
}

const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: "gpt-4.1-mini",
  anthropic: "claude-sonnet-4-20250514",
};

export function isAiProvider(value: unknown): value is AiProvider {
  return value === "openai" || value === "anthropic";
}

export function getAiProviderConfig(
  providerValue: unknown,
  env: NodeJS.ProcessEnv = process.env,
): AiProviderConfig {
  if (!isAiProvider(providerValue)) {
    throw new AiConfigurationError("AI provider must be either openai or anthropic.");
  }

  const apiKey = providerValue === "openai" ? env.OPENAI_API_KEY : env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    const variable = providerValue === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
    throw new AiConfigurationError(`${variable} is required when ${providerValue} is enabled.`);
  }

  const modelVariable = providerValue === "openai" ? env.OPENAI_MODEL : env.ANTHROPIC_MODEL;
  return {
    provider: providerValue,
    apiKey: apiKey.trim(),
    model: modelVariable?.trim() || DEFAULT_MODELS[providerValue],
    maxTokens: 1_024,
    temperature: 0.2,
  };
}
