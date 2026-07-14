import type { SupabaseClient } from "@supabase/supabase-js";
import { JESUP_SYSTEM_PROMPT } from "../prompts/system";
import { completeAiInteraction, failAiInteraction, startAiInteraction } from "./audit";
import type { AiProviderConfig } from "./config";
import { createAiProviderClient, type AiProviderClient } from "./proxy";
import { sanitizeRichText } from "@/lib/safe-rich-text";

export type FactsheetDraft = {
  title: string;
  description: string;
  author: string;
  tags: string[];
  contentHtml: string;
};

type GenerateFactsheetDraftInput = {
  db: SupabaseClient;
  userId: string;
  topic: string;
  researchNotes: string;
  config: AiProviderConfig;
  client?: AiProviderClient;
  timeoutMs?: number;
};

const FACTSHEET_PROMPT = `Create publication-catalog metadata for a CISC Extension factsheet using only the supplied research notes.

Return one JSON object with exactly these fields:
- "title": a clear public-facing title, maximum 120 characters
- "description": a plain-language summary of 2-4 sentences, maximum 1200 characters
- "author": an author or organization stated in the notes, or "CISC at Tuskegee University"
- "tags": 3-8 short lowercase topic tags
- "contentHtml": a 400-900 word factsheet body using only <h2>, <h3>, <p>, <strong>, <em>, <ul>, <ol>, and <li>

Do not add facts, statistics, recommendations, or claims that are absent from the notes. Return JSON only.`;

export async function generateFactsheetDraft(
  input: GenerateFactsheetDraftInput,
): Promise<FactsheetDraft> {
  const interactionId = await startAiInteraction(input.db, {
    userId: input.userId,
    feature: "factsheet-generator",
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
      systemPrompt: `${JESUP_SYSTEM_PROMPT}\n\n${FACTSHEET_PROMPT}`,
      messages: [
        {
          role: "user",
          content: `TOPIC:\n${input.topic}\n\nRESEARCH NOTES:\n${input.researchNotes}`,
        },
      ],
      maxTokens: 1_800,
      temperature: 0.1,
      signal: controller.signal,
    });
    const draft = parseFactsheetDraft(result.content);
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

export function parseFactsheetDraft(content: string): FactsheetDraft {
  const normalized = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  let value: unknown;
  try {
    value = JSON.parse(normalized);
  } catch {
    throw namedError("AiDraftFormatError", "The AI provider returned an invalid factsheet draft.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw namedError("AiDraftFormatError", "The AI provider returned an invalid factsheet draft.");
  }
  const record = value as Record<string, unknown>;
  const title = cleanString(record.title, 120);
  const description = cleanString(record.description, 1_200);
  const author = cleanString(record.author, 160) || "CISC at Tuskegee University";
  const tags = Array.isArray(record.tags)
    ? [
        ...new Set(record.tags.map((tag) => cleanString(tag, 40).toLowerCase()).filter(Boolean)),
      ].slice(0, 8)
    : [];
  const contentHtml = sanitizeRichText(cleanRawString(record.contentHtml, 20_000));
  if (!title || !description || !contentHtml) {
    throw namedError("AiDraftFormatError", "The AI draft is missing a title or description.");
  }
  return { title, description, author, tags, contentHtml };
}

function cleanRawString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function namedError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}
