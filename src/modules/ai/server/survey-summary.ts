import type { SupabaseClient } from "@supabase/supabase-js";
import { JESUP_SYSTEM_PROMPT } from "../prompts/system";
import { completeAiInteraction, failAiInteraction, startAiInteraction } from "./audit";
import type { AiProviderConfig } from "./config";
import { createAiProviderClient, type AiProviderClient } from "./proxy";

export type SurveySummary = {
  executiveSummary: string;
  themes: string[];
  strengths: string[];
  concerns: string[];
  recommendedActions: string[];
};

type GenerateSurveySummaryInput = {
  db: SupabaseClient;
  userId: string;
  surveyTitle: string;
  sanitizedResponses: string;
  responseCount: number;
  config: AiProviderConfig;
  client?: AiProviderClient;
  timeoutMs?: number;
};

const SUMMARY_PROMPT = `Analyze the supplied de-identified survey responses using only the supplied data.
Return JSON with exactly these fields: "executiveSummary" (2-4 sentences), "themes", "strengths", "concerns", and "recommendedActions" (arrays of concise strings, maximum 6 each).
Do not infer demographics, identities, causation, statistical significance, or consensus. Distinguish isolated comments from repeated patterns. If the sample is small or evidence is mixed, say so. Return JSON only.`;

export async function generateSurveySummary(
  input: GenerateSurveySummaryInput,
): Promise<SurveySummary> {
  const interactionId = await startAiInteraction(input.db, {
    userId: input.userId,
    feature: "survey-summarizer",
    provider: input.config.provider,
    model: input.config.model,
    sourceCount: input.responseCount,
  });
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 30_000);
  try {
    const client = input.client ?? createAiProviderClient(input.config);
    const result = await client.complete({
      systemPrompt: `${JESUP_SYSTEM_PROMPT}\n\n${SUMMARY_PROMPT}`,
      messages: [
        {
          role: "user",
          content: `SURVEY: ${input.surveyTitle}\nRESPONSE COUNT: ${input.responseCount}\n\nDE-IDENTIFIED RESPONSES:\n${input.sanitizedResponses}`,
        },
      ],
      maxTokens: 1_000,
      temperature: 0.1,
      signal: controller.signal,
    });
    const summary = parseSurveySummary(result.content);
    await completeAiInteraction(input.db, interactionId, result, Date.now() - startedAt);
    return summary;
  } catch (error) {
    const code = error instanceof Error ? error.name : "UnknownAiError";
    await failAiInteraction(input.db, interactionId, code, Date.now() - startedAt);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function parseSurveySummary(content: string): SurveySummary {
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
  const executiveSummary = cleanString(record.executiveSummary, 1_500);
  if (!executiveSummary) throw formatError();
  return {
    executiveSummary,
    themes: cleanList(record.themes),
    strengths: cleanList(record.strengths),
    concerns: cleanList(record.concerns),
    recommendedActions: cleanList(record.recommendedActions),
  };
}

function cleanList(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.map((item) => cleanString(item, 300)).filter(Boolean))].slice(0, 6)
    : [];
}

function cleanString(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function formatError(): Error {
  const error = new Error("The AI provider returned an invalid survey summary.");
  error.name = "AiSummaryFormatError";
  return error;
}
