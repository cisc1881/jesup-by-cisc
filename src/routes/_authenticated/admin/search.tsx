import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CommandCenterContentShell, CommandCenterPageHeader } from "@/modules/admin";
import { globalSearch } from "@/modules/cms";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

const ENTITY_LABELS: Record<string, string> = {
  program: "Program",
  event: "Event",
  market: "Market",
  publication: "Publication",
  podcast: "Podcast",
  partner: "Partner",
  grant: "Grant",
};

export const Route = createFileRoute("/_authenticated/admin/search")({ component: AdminSearch });

function AdminSearch() {
  const [query, setQuery] = useState("");

  const { data: results, isFetching } = useQuery({
    queryKey: ["global-search", query],
    queryFn: () => globalSearch(query),
    enabled: query.trim().length >= 2,
  });

  return (
    <CommandCenterContentShell>
      <CommandCenterPageHeader
        title="Global Search"
        description="Search across programs, events, markets, publications, podcasts, partners, and grants."
      />

      <div className="relative mb-8">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all content…"
          className="h-12 pl-12 text-lg"
          autoFocus
        />
      </div>

      {query.trim().length < 2 && (
        <p className="text-center text-muted-foreground">Type at least 2 characters to search.</p>
      )}

      {isFetching && <p className="text-muted-foreground">Searching…</p>}

      {results && results.length === 0 && query.trim().length >= 2 && (
        <p className="text-center text-muted-foreground">No results found.</p>
      )}

      <div className="space-y-3">
        {results?.map((result) => (
          <Card key={`${result.entityType}-${result.id}`}>
            <CardContent className="flex items-center gap-4 p-4">
              {result.imageUrl && (
                <img src={result.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {ENTITY_LABELS[result.entityType] ?? result.entityType}
                </div>
                <div className="font-medium text-foreground">{result.title}</div>
                {result.subtitle && (
                  <div className="truncate text-sm text-muted-foreground">{result.subtitle}</div>
                )}
              </div>
              {result.hrefParams ? (
                <Link
                  to={result.href}
                  params={result.hrefParams}
                  className="shrink-0 text-sm font-semibold text-primary hover:underline"
                  target="_blank"
                >
                  View →
                </Link>
              ) : (
                <a
                  href={result.href}
                  className="shrink-0 text-sm font-semibold text-primary hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  View →
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </CommandCenterContentShell>
  );
}
