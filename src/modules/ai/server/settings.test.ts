import { describe, expect, it } from "vitest";
import { AiConfigurationError } from "./config";
import { validateAiRuntimeSettings } from "./settings";

describe("AI runtime settings", () => {
  it("requires the feature to be explicitly enabled", () => {
    expect(() => validateAiRuntimeSettings({ enabled: false, provider: "openai" }, {})).toThrow(
      "Ask JESUP is not enabled",
    );
  });

  it("requires a supported provider", () => {
    expect(() => validateAiRuntimeSettings({ enabled: true, provider: "other" }, {})).toThrow(
      AiConfigurationError,
    );
  });

  it("requires the selected provider's server key", () => {
    expect(() => validateAiRuntimeSettings({ enabled: true, provider: "anthropic" }, {})).toThrow(
      "ANTHROPIC_API_KEY is required",
    );
  });

  it("returns configuration when settings and environment agree", () => {
    expect(
      validateAiRuntimeSettings(
        { enabled: true, provider: "openai" },
        { OPENAI_API_KEY: "server-secret" },
      ),
    ).toMatchObject({ provider: "openai", apiKey: "server-secret" });
  });
});
