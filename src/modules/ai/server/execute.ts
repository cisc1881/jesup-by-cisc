import type { SupabaseClient } from "@supabase/supabase-js";
import { JESUP_SYSTEM_PROMPT } from "../prompts/system";
import { completeAiInteraction, failAiInteraction, startAiInteraction } from "./audit";
import type { AiProviderConfig } from "./config";
import {
  createAiProviderClient,
  type AiCompletionResult,
  type AiMessage,
  type AiProviderClient,
} from "./proxy";
import { retrieveJESUPContext, searchJESUPContent, type AiRagContext, type AiSearch } from "./rag";

export type ExecuteJESUPRequest = {
  db: SupabaseClient;
  userId: string;
  question: string;
  history?: AiMessage[];
  config: AiProviderConfig;
  search?: AiSearch;
  client?: AiProviderClient;
  timeoutMs?: number;
};

export type ExecuteJESUPResult = AiCompletionResult & { context: AiRagContext };
export type ExecuteJESUPStreamResult = {
  stream: ReadableStream<Uint8Array>;
  context: AiRagContext;
};

export function buildConversationMessages(
  question: string,
  history: AiMessage[] = [],
): AiMessage[] {
  const boundedHistory = history
    .filter((message) => message.content.trim().length > 0)
    .slice(-6)
    .map((message) => ({
      role: message.role,
      content: message.content
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, message.role === "user" ? 240 : 2_000),
    }));
  return [
    ...boundedHistory,
    { role: "user", content: question.replace(/\s+/g, " ").trim().slice(0, 240) },
  ];
}

export async function executeJESUPRequest(input: ExecuteJESUPRequest): Promise<ExecuteJESUPResult> {
  const context = await retrieveJESUPContext(input.question, input.search ?? searchJESUPContent);
  if (context.query.length < 2) throw new Error("Question must contain at least 2 characters.");
  const client = input.client ?? createAiProviderClient(input.config);
  const interactionId = await startAiInteraction(input.db, {
    userId: input.userId,
    feature: "ask-jesup",
    provider: input.config.provider,
    model: input.config.model,
    sourceCount: context.sources.length,
  });
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 20_000);

  try {
    const result = await client.complete({
      systemPrompt: `${JESUP_SYSTEM_PROMPT}\n\nJESUP CONTEXT:\n${context.promptContext}`,
      messages: buildConversationMessages(context.query, input.history),
      signal: controller.signal,
    });
    await completeAiInteraction(input.db, interactionId, result, Date.now() - startedAt);
    return { ...result, context };
  } catch (error) {
    const errorCode = error instanceof Error ? error.name : "UnknownAiError";
    await failAiInteraction(input.db, interactionId, errorCode, Date.now() - startedAt);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function executeJESUPStream(
  input: ExecuteJESUPRequest,
): Promise<ExecuteJESUPStreamResult> {
  const context = await retrieveJESUPContext(input.question, input.search ?? searchJESUPContent);
  if (context.query.length < 2) throw new Error("Question must contain at least 2 characters.");
  const client = input.client ?? createAiProviderClient(input.config);
  const interactionId = await startAiInteraction(input.db, {
    userId: input.userId,
    feature: "ask-jesup",
    provider: input.config.provider,
    model: input.config.model,
    sourceCount: context.sources.length,
  });
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 20_000);

  try {
    const result = await client.stream({
      systemPrompt: `${JESUP_SYSTEM_PROMPT}\n\nJESUP CONTEXT:\n${context.promptContext}`,
      messages: buildConversationMessages(context.query, input.history),
      signal: controller.signal,
    });
    const reader = result.stream.getReader();
    const chunks: Uint8Array[] = [];
    const auditedStream = new ReadableStream<Uint8Array>({
      async pull(streamController) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            clearTimeout(timeout);
            const content = new TextDecoder().decode(concatChunks(chunks));
            await completeAiInteraction(
              input.db,
              interactionId,
              {
                content,
                provider: result.provider,
                model: result.model,
                requestId: result.requestId,
                usage: { inputTokens: null, outputTokens: null },
              },
              Date.now() - startedAt,
            );
            streamController.close();
            return;
          }
          chunks.push(value);
          streamController.enqueue(value);
        } catch (error) {
          clearTimeout(timeout);
          const errorCode = error instanceof Error ? error.name : "UnknownAiError";
          await failAiInteraction(input.db, interactionId, errorCode, Date.now() - startedAt);
          streamController.error(error);
        }
      },
      async cancel(reason) {
        clearTimeout(timeout);
        await reader.cancel(reason);
        await failAiInteraction(input.db, interactionId, "StreamCancelled", Date.now() - startedAt);
      },
    });
    return { stream: auditedStream, context };
  } catch (error) {
    clearTimeout(timeout);
    const errorCode = error instanceof Error ? error.name : "UnknownAiError";
    await failAiInteraction(input.db, interactionId, errorCode, Date.now() - startedAt);
    throw error;
  }
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const output = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}
