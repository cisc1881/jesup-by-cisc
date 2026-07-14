import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  GraduationCap,
  LayoutGrid,
  MapPin,
  Mic,
  Newspaper,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  SEARCH_ENTITY_LABELS,
  type SearchEntityType,
  type SearchResultGroup,
  type UniversalSearchResult,
} from "@/lib/search";

const ENTITY_ICONS: Record<SearchEntityType, LucideIcon> = {
  program: LayoutGrid,
  publication: BookOpen,
  event: Calendar,
  market: MapPin,
  twofas: GraduationCap,
  grant: DollarSign,
  partner: Building2,
  podcast: Mic,
  news: Newspaper,
};

function SearchResultLink({
  result,
  compact,
  onNavigate,
}: {
  result: UniversalSearchResult;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = ENTITY_ICONS[result.entityType];
  const content = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
        {result.imageUrl ? (
          <img src={result.imageUrl} alt={result.title} className="h-10 w-10 rounded-xl object-cover" loading="lazy" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-foreground">{result.title}</div>
        {result.description && (
          <p className={compact ? "line-clamp-1 text-xs text-muted-foreground" : "line-clamp-2 text-sm text-muted-foreground"}>
            {result.description}
          </p>
        )}
        <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide text-primary/80">
          {SEARCH_ENTITY_LABELS[result.entityType]}
        </span>
      </div>
    </>
  );

  const className = `flex w-full items-start gap-3 rounded-lg text-left transition hover:bg-secondary/60 ${
    compact ? "px-2 py-2" : "p-3"
  }`;

  if (result.hrefParams) {
    return (
      <Link to={result.href} params={result.hrefParams} className={className} onClick={onNavigate}>
        {content}
      </Link>
    );
  }

  return (
    <Link to={result.href} className={className} onClick={onNavigate}>
      {content}
    </Link>
  );
}

export function SearchResultsGrouped({
  groups,
  compact,
  onNavigate,
}: {
  groups: SearchResultGroup[];
  compact?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className={compact ? "space-y-4" : "space-y-8"}>
      {groups.map((group) => (
        <section key={group.entityType}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            <span className="gold-bar" />
            {group.label}
            <span className="font-normal normal-case text-muted-foreground/80">({group.results.length})</span>
          </h2>
          <div className={compact ? "space-y-1" : "grid gap-3 sm:grid-cols-2"}>
            {group.results.map((result) => (
              <Card key={`${group.entityType}-${result.id}`} className={compact ? "border-0 shadow-none" : "border-0 shadow-token-soft"}>
                <CardContent className={compact ? "p-0" : "p-0"}>
                  <SearchResultLink result={result} compact={compact} onNavigate={onNavigate} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function SearchEmptyState({ query, minLength }: { query: string; minLength: number }) {
  if (query.trim().length < minLength) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
          <Search className="h-6 w-6" />
        </span>
        <p className="text-sm text-muted-foreground">
          Search programs, events, markets, publications, 2FAS opportunities, grants, partners, and podcasts.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Type at least {minLength} characters to begin.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Briefcase className="h-6 w-6" />
      </span>
      <p className="font-medium text-foreground">No results for &ldquo;{query}&rdquo;</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Try different keywords, check spelling, or browse programs and events from the home page.
      </p>
    </div>
  );
}

export function SearchLoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      Searching JESUP…
    </div>
  );
}
