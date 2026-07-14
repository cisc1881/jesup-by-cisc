import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { CommandCenterContentShell, CommandCenterPageHeader } from "@/modules/admin";
import { Input } from "@/components/ui/input";
import {
  SearchEmptyState,
  SearchLoadingState,
  SearchResultsGrouped,
} from "@/components/search/search-results";
import { MIN_SEARCH_QUERY_LENGTH, universalSearch } from "@/lib/search";
import { universalSearchQueryKey } from "@/lib/query-config";

export const Route = createFileRoute("/_authenticated/admin/search")({ component: AdminSearch });

function AdminSearch() {
  const [query, setQuery] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: universalSearchQueryKey(query),
    queryFn: () => universalSearch(query, { limit: 60 }),
    enabled: query.trim().length >= MIN_SEARCH_QUERY_LENGTH,
  });

  const hasResults = (data?.totalCount ?? 0) > 0;

  return (
    <CommandCenterContentShell>
      <CommandCenterPageHeader
        title="Global Search"
        description="Search across programs, events, markets, publications, 2FAS opportunities, grants, partners, and podcasts."
      />

      <div className="relative mb-8">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all JESUP content…"
          className="h-12 pl-12 text-lg shadow-token-soft"
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
            {data.totalCount} result{data.totalCount === 1 ? "" : "s"} grouped by content type
          </p>
          <SearchResultsGrouped groups={data.groups} />
        </div>
      )}
    </CommandCenterContentShell>
  );
}
