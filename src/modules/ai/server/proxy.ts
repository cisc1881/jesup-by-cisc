import type { AiProviderConfig } from "./config";

export type AiMessage = { role: "user" | "assistant"; content: string };
export type AiCompletionRequest = {
  systemPrompt: string;
  messages: AiMessage[];
  maxTokens?: number;
  temperature?: number;
};
export type AiCompletionResult = {
  content: string;
  provider: AiProviderConfig["provider"];
  model: string;
  requestId: string | null;
  usage: { inputTokens: number | null; outputTokens: number | null };
};

export interface AiProviderClient {
  complete(request: AiCompletionRequest): Promise<AiCompletionResult>;
}

export function createAiProviderClient(config: AiProviderConfig): AiProviderClient {
  return config.provider === "openai" ? createOpenAiClient(config) : createAnthropicClient(config);
}

function createOpenAiClient(config: AiProviderConfig): AiProviderClient {
  return {
    async complete(request) {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.model,
          instructions: request.systemPrompt,
          input: request.messages,
          max_output_tokens: request.maxTokens ?? config.maxTokens,
          temperature: request.temperature ?? config.temperature,
        }),
      });
      const body = (await response.json()) as Record<string, unknown>;
      if (!response.ok) throw providerError("openai", response.status, body);

      const output = Array.isArray(body.output) ? body.output : [];
      const blocks = output.flatMap((item) => {
        const content = asRecord(item).content;
        return Array.isArray(content) ? content : [];
      });
      const textBlock = blocks.find((item) => asRecord(item).type === "output_text");
      const usage = asRecord(body.usage);
      return {
        content: String(asRecord(textBlock).text ?? ""),
        provider: "openai",
        model: config.model,
        requestId: response.headers.get("x-request-id"),
        usage: {
          inputTokens: asNullableNumber(usage.input_tokens),
          outputTokens: asNullableNumber(usage.output_tokens),
        },
      };
    },
  };
}

function createAnthropicClient(config: AiProviderConfig): AiProviderClient {
  return {
    async complete(request) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          system: request.systemPrompt,
          messages: request.messages,
          max_tokens: request.maxTokens ?? config.maxTokens,
          temperature: request.temperature ?? config.temperature,
        }),
      });
      const body = (await response.json()) as Record<string, unknown>;
      if (!response.ok) throw providerError("anthropic", response.status, body);

      const blocks = Array.isArray(body.content) ? body.content : [];
      const content = blocks
        .filter((block) => asRecord(block).type === "text")
        .map((block) => String(asRecord(block).text ?? ""))
        .join("\n");
      const usage = asRecord(body.usage);
      return {
        content,
        provider: "anthropic",
        model: config.model,
        requestId: response.headers.get("request-id"),
        usage: {
          inputTokens: asNullableNumber(usage.input_tokens),
          outputTokens: asNullableNumber(usage.output_tokens),
        },
      };
    },
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function providerError(provider: string, status: number, body: Record<string, unknown>): Error {
  const message = asRecord(body.error).message;
  const error = new Error(
    typeof message === "string" ? message : `${provider} request failed with status ${status}.`,
  );
  error.name = "AiProviderError";
  return error;
}
