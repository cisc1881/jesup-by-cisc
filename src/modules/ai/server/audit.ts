import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiCompletionResult } from "./proxy";

type AdminDb = SupabaseClient;

function interactionsTable(db: AdminDb) {
  return (db as unknown as { from: (table: string) => ReturnType<AdminDb["from"]> }).from(
    "ai_interactions",
  );
}

export type AiAuditStart = {
  userId: string;
  feature: string;
  provider: string;
  model: string;
  sourceCount: number;
};

export async function startAiInteraction(db: AdminDb, input: AiAuditStart): Promise<string> {
  const { data, error } = await interactionsTable(db)
    .insert({
      user_id: input.userId,
      feature: input.feature,
      provider: input.provider,
      model: input.model,
      status: "started",
      metadata: { source_count: input.sourceCount },
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function completeAiInteraction(
  db: AdminDb,
  interactionId: string,
  result: AiCompletionResult,
  durationMs: number,
): Promise<void> {
  const { error } = await interactionsTable(db)
    .update({
      status: "completed",
      request_id: result.requestId,
      input_tokens: result.usage.inputTokens,
      output_tokens: result.usage.outputTokens,
      duration_ms: durationMs,
      completed_at: new Date().toISOString(),
    })
    .eq("id", interactionId);
  if (error) throw error;
}

export async function failAiInteraction(
  db: AdminDb,
  interactionId: string,
  errorCode: string,
  durationMs: number,
): Promise<void> {
  const { error } = await interactionsTable(db)
    .update({
      status: "failed",
      error_code: errorCode.slice(0, 100),
      duration_ms: durationMs,
      completed_at: new Date().toISOString(),
    })
    .eq("id", interactionId);
  if (error) throw error;
}
