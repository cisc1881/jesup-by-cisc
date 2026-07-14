import { describe, expect, it } from "vitest";
import { AiConfigurationError, getAiProviderConfig, isAiProvider } from "./config";

describe("AI provider configuration", () => {
  it("accepts only supported providers", () => {
    expect(isAiProvider("openai")).toBe(true);
    expect(isAiProvider("anthropic")).toBe(true);
    expect(isAiProvider("other")).toBe(false);
  });

  it("requires a server-only provider key", () => {
    expect(() => getAiProviderConfig("openai", {})).toThrow(AiConfigurationError);
    expect(() => getAiProviderConfig("anthropic", { VITE_ANTHROPIC_API_KEY: "unsafe" })).toThrow(
      "ANTHROPIC_API_KEY is required",
    );
  });

  it("returns normalized OpenAI configuration", () => {
    expect(
      getAiProviderConfig("openai", {
        OPENAI_API_KEY: " test-key ",
        OPENAI_MODEL: "custom-model",
      }),
    ).toMatchObject({ provider: "openai", apiKey: "test-key", model: "custom-model" });
  });
});
