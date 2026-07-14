import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { Input } from "@/components/ui/input";
import {
  SearchEmptyState,
  SearchLoadingState,
  SearchResultsGrouped,
} from "@/components/search/search-results";
import { MIN_SEARCH_QUERY_LENGTH, universalSearch } from "@/lib/search";
import { universalSearchQueryKey } from "@/lib/query-config";

type SearchParams = {
  q?: string;
};

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "Search · JESUP" },
      { name: "description", content: "Search programs, events, markets, publications, and more across JESUP." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const navigate = useNavigate({ from: "/search" });
  const { q: initialQ = "" } = Route.useSearch();
  const [query, setQuery] = useState(initialQ);

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === (initialQ ?? "")) return;
    const timer = window.setTimeout(() => {
      navigate({ search: trimmed ? { q: trimmed } : {}, replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, initialQ, navigate]);

  const { data, isFetching } = useQuery({
    queryKey: universalSearchQueryKey(query),
    queryFn: () => universalSearch(query, { limit: 50 }),
    enabled: query.trim().length >= MIN_SEARCH_QUERY_LENGTH,
  });

  const hasResults = (data?.totalCount ?? 0) > 0;

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Discover JESUP"
        title="Search"
        description="Find programs, events, farmers markets, publications, 2FAS opportunities, grants, partners, and podcasts."
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="relative mb-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="h-12 pl-12 text-base shadow-token-soft"
            autoFocus
          />
        </div>

        {query.trim().length < MIN_SEARCH_QUERY_LENGTH && (
          <SearchEmptyState query={query} minLength={MIN_SEARCH_QUERY_LENGTH} />
        )}
        {isFetching && query.trim().length >= MIN_SEARCH_QUERY_LENGTH && <SearchLoadingState />}
        {!isFetching && query.trim().length >= MIN_SEARCH_QUERY_LENGTH && !hasResults && (
          <SearchEmptyState query={query} minLength={MIN_SEARCH_QUERY_LENGTH} />
        )}
        {!isFetching && hasResults && data && (
          <div>
            <p className="mb-6 text-sm text-muted-foreground">
              {data.totalCount} result{data.totalCount === 1 ? "" : "s"} for &ldquo;{data.query}&rdquo;
            </p>
            <SearchResultsGrouped groups={data.groups} />
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
