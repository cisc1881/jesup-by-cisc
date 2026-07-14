import type { SupabaseClient } from "@supabase/supabase-js";
import { JESUP_SYSTEM_PROMPT } from "../prompts/system";
import { completeAiInteraction, failAiInteraction, startAiInteraction } from "./audit";
import type { AiProviderConfig } from "./config";
import { createAiProviderClient, type AiProviderClient } from "./proxy";

export type ImpactReportNarrative = {
  reportTitle: string;
  eventPurpose: string;
  programGoals: string;
  outcomesImpactNotes: string;
  recommendations: string;
  followUpActions: string;
};

type GenerateImpactReportInput = {
  db: SupabaseClient;
  userId: string;
  metricsContext: string;
  config: AiProviderConfig;
  client?: AiProviderClient;
  timeoutMs?: number;
};

const IMPACT_REPORT_PROMPT = `Draft editable narrative fields for a CISC Extension event impact report using only the aggregate metrics supplied by the user.
Return JSON with exactly these string fields: "reportTitle", "eventPurpose", "programGoals", "outcomesImpactNotes", "recommendations", and "followUpActions".
Use plain, professional language. Never claim causation, long-term impact, statistical significance, or participant outcomes not directly supported by the metrics. Call low response counts or missing measures out as limitations. Do not invent quotes, goals, partnerships, or recommendations. Return JSON only.`;

export async function generateImpactReportNarrative(
  input: GenerateImpactReportInput,
): Promise<ImpactReportNarrative> {
  const interactionId = await startAiInteraction(input.db, {
    userId: input.userId,
    feature: "impact-report-generator",
    provider: input.config.provider,
    model: input.config.model,
    sourceCount: 0,
  });
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 30_000);
  try {
    const client = input.client ?? createAiProviderClient(input.config);
    const result = await client.complete({
      systemPrompt: `${JESUP_SYSTEM_PROMPT}\n\n${IMPACT_REPORT_PROMPT}`,
      messages: [{ role: "user", content: `AGGREGATE REPORT METRICS:\n${input.metricsContext}` }],
      maxTokens: 1_200,
      temperature: 0.1,
      signal: controller.signal,
    });
    const narrative = parseImpactReportNarrative(result.content);
    await completeAiInteraction(input.db, interactionId, result, Date.now() - startedAt);
    return narrative;
  } catch (error) {
    const code = error instanceof Error ? error.name : "UnknownAiError";
    await failAiInteraction(input.db, interactionId, code, Date.now() - startedAt);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function parseImpactReportNarrative(content: string): ImpactReportNarrative {
  const normalized = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  let value: unknown;
  try {
    value = JSON.parse(normalized);
  } catch {
    throw formatError();
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw formatError();
  const record = value as Record<string, unknown>;
  const narrative = {
    reportTitle: clean(record.reportTitle, 160),
    eventPurpose: clean(record.eventPurpose, 1_200),
    programGoals: clean(record.programGoals, 1_200),
    outcomesImpactNotes: clean(record.outcomesImpactNotes, 2_000),
    recommendations: clean(record.recommendations, 1_500),
    followUpActions: clean(record.followUpActions, 1_500),
  };
  if (!narrative.reportTitle || !narrative.outcomesImpactNotes) throw formatError();
  return narrative;
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function formatError() {
  const error = new Error("The AI provider returned an invalid impact report narrative.");
  error.name = "AiImpactFormatError";
  return error;
}
