import { supabase } from "@/integrations/supabase/client";

export type SearchEntityType =
  | "program"
  | "publication"
  | "event"
  | "market"
  | "twofas"
  | "grant"
  | "partner"
  | "podcast"
  | "news";

export type UniversalSearchResult = {
  id: string;
  entityType: SearchEntityType;
  title: string;
  description: string | null;
  href: string;
  hrefParams?: Record<string, string>;
  imageUrl: string | null;
  score: number;
};

export type SearchResultGroup = {
  entityType: SearchEntityType;
  label: string;
  results: UniversalSearchResult[];
};

export type UniversalSearchResponse = {
  query: string;
  groups: SearchResultGroup[];
  totalCount: number;
};

export const SEARCH_ENTITY_LABELS: Record<SearchEntityType, string> = {
  program: "Programs",
  publication: "Publications",
  event: "Events",
  market: "Farmers Markets",
  twofas: "2FAS Opportunities",
  grant: "Grants",
  partner: "Partners",
  podcast: "Podcasts",
  news: "News & Stories",
};

export const SEARCH_GROUP_ORDER: SearchEntityType[] = [
  "program",
  "event",
  "market",
  "publication",
  "twofas",
  "grant",
  "partner",
  "podcast",
  "news",
];

const MIN_QUERY_LENGTH = 2;

function matchesQuery(text: string | null | undefined, q: string) {
  return text?.toLowerCase().includes(q) ?? false;
}

function scoreMatch(text: string | null | undefined, q: string) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  if (lower === q) return 100;
  if (lower.startsWith(q)) return 80;
  if (lower.includes(q)) return 50;
  return 0;
}

function bestScore(fields: (string | null | undefined)[], q: string) {
  return Math.max(0, ...fields.map((f) => scoreMatch(f, q)));
}

function stripHtml(html: string | null | undefined) {
  if (!html) return null;
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null;
}

function buildResult(
  partial: Omit<UniversalSearchResult, "score"> & { scoreFields: (string | null | undefined)[] },
  q: string,
): UniversalSearchResult | null {
  if (!partial.scoreFields.some((f) => matchesQuery(f, q))) return null;
  const { scoreFields, ...rest } = partial;
  return { ...rest, score: bestScore(scoreFields, q) };
}

export function groupSearchResults(results: UniversalSearchResult[]): SearchResultGroup[] {
  const byType = new Map<SearchEntityType, UniversalSearchResult[]>();
  for (const result of results) {
    const list = byType.get(result.entityType) ?? [];
    list.push(result);
    byType.set(result.entityType, list);
  }

  return SEARCH_GROUP_ORDER.filter((type) => (byType.get(type)?.length ?? 0) > 0).map((entityType) => ({
    entityType,
    label: SEARCH_ENTITY_LABELS[entityType],
    results: (byType.get(entityType) ?? []).sort((a, b) => b.score - a.score),
  }));
}

export async function universalSearch(
  query: string,
  options?: { limit?: number },
): Promise<UniversalSearchResponse> {
  const q = query.trim().toLowerCase();
  if (!q || q.length < MIN_QUERY_LENGTH) {
    return { query: q, groups: [], totalCount: 0 };
  }

  const limit = options?.limit ?? 40;

  const [programsRes, eventsRes, marketsRes, publicationsRes, twofasRes, grantsRes, partnersRes, podcastsRes, newsRes] =
    await Promise.all([
      supabase.from("programs").select("id, slug, name, tagline, short, cover_image_url").eq("is_active", true),
      supabase
        .from("events")
        .select("id, slug, title, description, location, image_url")
        .eq("is_active", true)
        .eq("status", "published"),
      supabase.from("markets").select("id, slug, name, description, city, state, image_url").eq("is_active", true),
      supabase
        .from("publications")
        .select("id, slug, title, description, author, cover_image_url")
        .eq("is_active", true),
      supabase
        .from("internships")
        .select("id, slug, title, description, department, requirements_html, is_2fas, is_open")
        .eq("is_2fas", true)
        .eq("is_open", true),
      supabase.from("grants").select("id, title, funder, description"),
      supabase.from("partners").select("id, slug, name, short_description, description, category, logo_url").eq("is_published", true),
      supabase.from("podcast_episodes").select("id, slug, title, description, guest, cover_url").eq("is_published", true),
      supabase
        .from("news_articles")
        .select("id, slug, title, summary, author, category, cover_image_url")
        .eq("is_published", true),
    ]);

  const results: UniversalSearchResult[] = [];

  for (const row of programsRes.data ?? []) {
    const hit = buildResult(
      {
        id: row.id,
        entityType: "program",
        title: row.name,
        description: row.tagline ?? row.short ?? null,
        href: "/programs/$slug",
        hrefParams: { slug: row.slug },
        imageUrl: row.cover_image_url,
        scoreFields: [row.name, row.tagline, row.short],
      },
      q,
    );
    if (hit) results.push(hit);
  }

  for (const row of eventsRes.data ?? []) {
    const hit = buildResult(
      {
        id: row.id,
        entityType: "event",
        title: row.title,
        description: row.location ?? stripHtml(row.description),
        href: "/events/$id",
        hrefParams: { id: row.slug ?? row.id },
        imageUrl: row.image_url,
        scoreFields: [row.title, row.description, row.location],
      },
      q,
    );
    if (hit) results.push(hit);
  }

  for (const row of marketsRes.data ?? []) {
    const location = [row.city, row.state].filter(Boolean).join(", ") || null;
    const hit = buildResult(
      {
        id: row.id,
        entityType: "market",
        title: row.name,
        description: location ?? row.description,
        href: "/markets/$id",
        hrefParams: { id: row.slug ?? row.id },
        imageUrl: row.image_url,
        scoreFields: [row.name, row.description, row.city, row.state],
      },
      q,
    );
    if (hit) results.push(hit);
  }

  for (const row of publicationsRes.data ?? []) {
    const hit = buildResult(
      {
        id: row.id,
        entityType: "publication",
        title: row.title,
        description: row.description ?? row.author,
        href: "/publications/$slug",
        hrefParams: { slug: row.slug ?? row.id },
        imageUrl: row.cover_image_url,
        scoreFields: [row.title, row.description, row.author],
      },
      q,
    );
    if (hit) results.push(hit);
  }

  for (const row of twofasRes.data ?? []) {
    const hit = buildResult(
      {
        id: row.id,
        entityType: "twofas",
        title: row.title,
        description: row.department ?? stripHtml(row.requirements_html) ?? row.description,
        href: "/internships",
        imageUrl: null,
        scoreFields: [row.title, row.description, row.department, stripHtml(row.requirements_html)],
      },
      q,
    );
    if (hit) results.push(hit);
  }

  for (const row of grantsRes.data ?? []) {
    const hit = buildResult(
      {
        id: row.id,
        entityType: "grant",
        title: row.title,
        description: row.funder ?? row.description,
        href: "/grants",
        imageUrl: null,
        scoreFields: [row.title, row.funder, row.description],
      },
      q,
    );
    if (hit) results.push(hit);
  }

  for (const row of partnersRes.data ?? []) {
    const hit = buildResult(
      {
        id: row.id,
        entityType: "partner",
        title: row.name,
        description: row.description,
        href: "/partners/$slug",
        hrefParams: { slug: row.slug },
        imageUrl: row.logo_url,
        scoreFields: [row.name, row.short_description, row.description, row.category],
      },
      q,
    );
    if (hit) results.push(hit);
  }

  for (const row of podcastsRes.data ?? []) {
    const hit = buildResult(
      {
        id: row.id,
        entityType: "podcast",
        title: row.title,
        description: row.guest ?? row.description,
        href: "/podcasts/$slug",
        hrefParams: { slug: row.slug },
        imageUrl: row.cover_url,
        scoreFields: [row.title, row.description, row.guest],
      },
      q,
    );
    if (hit) results.push(hit);
  }

  for (const row of newsRes.data ?? []) {
    const hit = buildResult(
      {
        id: row.id,
        entityType: "news",
        title: row.title,
        description: row.summary ?? row.author,
        href: "/news/$slug",
        hrefParams: { slug: row.slug },
        imageUrl: row.cover_image_url,
        scoreFields: [row.title, row.summary, row.author, row.category],
      },
      q,
    );
    if (hit) results.push(hit);
  }

  const sorted = results.sort((a, b) => b.score - a.score).slice(0, limit);
  const groups = groupSearchResults(sorted);

  return {
    query: q,
    groups,
    totalCount: sorted.length,
  };
}

/** Flat list for legacy callers */
export async function flatUniversalSearch(query: string, limit = 30): Promise<UniversalSearchResult[]> {
  const { groups } = await universalSearch(query, { limit });
  return groups.flatMap((g) => g.results);
}

export const MIN_SEARCH_QUERY_LENGTH = MIN_QUERY_LENGTH;
