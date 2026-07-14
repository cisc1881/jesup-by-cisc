import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  SearchEmptyState,
  SearchLoadingState,
  SearchResultsGrouped,
} from "@/components/search/search-results";
import { MIN_SEARCH_QUERY_LENGTH, universalSearch } from "@/lib/search";
import { universalSearchQueryKey } from "@/lib/query-config";

type GlobalSearchDialogProps = {
  adminMode?: boolean;
};

export function GlobalSearchDialog({ adminMode = true }: GlobalSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: universalSearchQueryKey(query),
    queryFn: () => universalSearch(query, { limit: 24 }),
    enabled: query.trim().length >= MIN_SEARCH_QUERY_LENGTH,
  });

  const hasResults = (data?.totalCount ?? 0) > 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden gap-2 sm:inline-flex"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="text-muted-foreground">Search…</span>
        <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-block">
          ⌘K
        </kbd>
      </Button>
      <Button variant="outline" size="icon" className="sm:hidden" aria-label="Search" onClick={() => setOpen(true)}>
        <Search className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="text-base">Search JESUP</DialogTitle>
          </DialogHeader>
          <div className="border-b px-4 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Programs, events, markets, 2FAS, grants…"
                className="pl-9"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[50vh] overflow-y-auto px-2 py-3">
            {query.trim().length < MIN_SEARCH_QUERY_LENGTH && (
              <SearchEmptyState query={query} minLength={MIN_SEARCH_QUERY_LENGTH} />
            )}
            {isFetching && query.trim().length >= MIN_SEARCH_QUERY_LENGTH && <SearchLoadingState />}
            {!isFetching && query.trim().length >= MIN_SEARCH_QUERY_LENGTH && !hasResults && (
              <SearchEmptyState query={query} minLength={MIN_SEARCH_QUERY_LENGTH} />
            )}
            {!isFetching && hasResults && data && (
              <SearchResultsGrouped
                groups={data.groups}
                compact
                onNavigate={() => setOpen(false)}
              />
            )}
          </div>
          {adminMode && (
            <div className="border-t px-4 py-3">
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link to="/admin/search" onClick={() => setOpen(false)}>
                  Open full search in Command Center
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
