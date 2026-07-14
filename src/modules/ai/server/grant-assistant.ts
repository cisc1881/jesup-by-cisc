import type { SupabaseClient } from "@supabase/supabase-js";
import { JESUP_SYSTEM_PROMPT } from "../prompts/system";
import { completeAiInteraction, failAiInteraction, startAiInteraction } from "./audit";
import type { AiProviderConfig } from "./config";
import { createAiProviderClient, type AiProviderClient } from "./proxy";

export type GrantDraft = {
  title: string;
  funder: string;
  description: string;
  amount: string;
  deadline: string;
};

type GenerateGrantDraftInput = {
  db: SupabaseClient;
  userId: string;
  sourceNotes: string;
  config: AiProviderConfig;
  client?: AiProviderClient;
  timeoutMs?: number;
};

const GRANT_PROMPT = `Create grant-catalog metadata using only the supplied official source notes.

Return one JSON object with exactly these fields:
- "title": the grant or funding opportunity name, maximum 160 characters
- "funder": the funding organization named in the notes, maximum 160 characters
- "description": a plain-language summary of purpose, eligible applicants, and supported activities, maximum 1600 characters
- "amount": the award amount or range exactly as supported by the notes, otherwise an empty string
- "deadline": the application deadline as YYYY-MM-DD only when an exact date is stated, otherwise an empty string

Do not invent eligibility, award amounts, deadlines, requirements, URLs, or assurances of funding. Do not interpret relative dates such as "next Friday". Return JSON only.`;

export async function generateGrantDraft(input: GenerateGrantDraftInput): Promise<GrantDraft> {
  const interactionId = await startAiInteraction(input.db, {
    userId: input.userId,
    feature: "grant-assistant",
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
      systemPrompt: `${JESUP_SYSTEM_PROMPT}\n\n${GRANT_PROMPT}`,
      messages: [{ role: "user", content: `OFFICIAL GRANT SOURCE NOTES:\n${input.sourceNotes}` }],
      maxTokens: 900,
      temperature: 0.1,
      signal: controller.signal,
    });
    const draft = parseGrantDraft(result.content);
    await completeAiInteraction(input.db, interactionId, result, Date.now() - startedAt);
    return draft;
  } catch (error) {
    const errorCode = error instanceof Error ? error.name : "UnknownAiError";
    await failAiInteraction(input.db, interactionId, errorCode, Date.now() - startedAt);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function parseGrantDraft(content: string): GrantDraft {
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
  const draft = {
    title: cleanString(record.title, 160),
    funder: cleanString(record.funder, 160),
    description: cleanString(record.description, 1_600),
    amount: cleanString(record.amount, 120),
    deadline: cleanDeadline(record.deadline),
  };
  if (!draft.title || !draft.description) throw formatError();
  return draft;
}

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function cleanDeadline(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? "" : value;
}

function formatError(): Error {
  const error = new Error("The AI provider returned an invalid grant draft.");
  error.name = "AiDraftFormatError";
  return error;
}
