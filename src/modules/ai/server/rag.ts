import type { UniversalSearchResult } from "@/lib/search";

export type AiContextSource = {
  id: string;
  entityType: UniversalSearchResult["entityType"];
  title: string;
  description: string | null;
  href: string;
};

export type AiRagContext = {
  query: string;
  sources: AiContextSource[];
  promptContext: string;
};

export type AiSearch = (query: string, limit: number) => Promise<UniversalSearchResult[]>;

const MAX_QUERY_LENGTH = 240;
const MAX_DESCRIPTION_LENGTH = 500;

export async function searchJESUPContent(
  query: string,
  limit: number,
): Promise<UniversalSearchResult[]> {
  const { flatUniversalSearch } = await import("@/lib/search");
  return flatUniversalSearch(query, limit);
}

export async function retrieveJESUPContext(
  question: string,
  search: AiSearch,
  limit = 8,
): Promise<AiRagContext> {
  const query = normalizeQuestion(question);
  if (query.length < 2)
    return { query, sources: [], promptContext: "No relevant JESUP content was found." };

  const results = await search(query, Math.min(Math.max(limit, 1), 12));
  const sources = results.map(toContextSource);
  return {
    query,
    sources,
    promptContext:
      sources.length === 0
        ? "No relevant JESUP content was found."
        : sources.map(formatSource).join("\n\n"),
  };
}

export function normalizeQuestion(question: string): string {
  return question.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
}

function toContextSource(result: UniversalSearchResult): AiContextSource {
  return {
    id: result.id,
    entityType: result.entityType,
    title: result.title.replace(/\s+/g, " ").trim(),
    description:
      result.description?.replace(/\s+/g, " ").trim().slice(0, MAX_DESCRIPTION_LENGTH) || null,
    href: buildHref(result.href, result.hrefParams),
  };
}

function buildHref(template: string, params?: Record<string, string>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (href, [key, value]) => href.replace(`$${key}`, encodeURIComponent(value)),
    template,
  );
}

function formatSource(source: AiContextSource, index: number): string {
  return [
    `[${index + 1}] ${source.title}`,
    `Type: ${source.entityType}`,
    source.description ? `Details: ${source.description}` : null,
    `JESUP link: ${source.href}`,
  ]
    .filter(Boolean)
    .join("\n");
}
