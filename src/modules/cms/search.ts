import { flatUniversalSearch } from "@/lib/search";
import type { SearchResult } from "./types";

/** @deprecated Prefer universalSearch from @/lib/search */
export async function globalSearch(query: string, limit = 30): Promise<SearchResult[]> {
  const results = await flatUniversalSearch(query, limit);
  return results.map((r) => ({
    id: r.id,
    entityType: r.entityType,
    title: r.title,
    subtitle: r.description,
    href: r.href,
    hrefParams: r.hrefParams,
    imageUrl: r.imageUrl,
    score: r.score,
  }));
}

export { universalSearch, flatUniversalSearch, groupSearchResults } from "@/lib/search";
