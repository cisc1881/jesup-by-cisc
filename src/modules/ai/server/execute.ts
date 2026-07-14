import type { SupabaseClient } from "@supabase/supabase-js";
import { JESUP_SYSTEM_PROMPT } from "../prompts/system";
import { completeAiInteraction, failAiInteraction, startAiInteraction } from "./audit";
import type { AiProviderConfig } from "./config";
import { createAiProviderClient, type AiCompletionResult, type AiProviderClient } from "./proxy";
import { retrieveJESUPContext, searchJESUPContent, type AiRagContext, type AiSearch } from "./rag";

export type ExecuteJESUPRequest = {
  db: SupabaseClient;
  userId: string;
  question: string;
  config: AiProviderConfig;
  search?: AiSearch;
  client?: AiProviderClient;
};

export type ExecuteJESUPResult = AiCompletionResult & { context: AiRagContext };

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

  try {
    const result = await client.complete({
      systemPrompt: `${JESUP_SYSTEM_PROMPT}\n\nJESUP CONTEXT:\n${context.promptContext}`,
      messages: [{ role: "user", content: context.query }],
    });
    await completeAiInteraction(input.db, interactionId, result, Date.now() - startedAt);
    return { ...result, context };
  } catch (error) {
    const errorCode = error instanceof Error ? error.name : "UnknownAiError";
    await failAiInteraction(input.db, interactionId, errorCode, Date.now() - startedAt);
    throw error;
  }
}
