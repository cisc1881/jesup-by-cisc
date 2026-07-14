import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import {
  EmptyState,
  HorizontalScroll,
  HorizontalScrollItem,
  LoadingState,
  PageContainer,
} from "@/components/design-system";
import { PublicationCard, PublicationFilters } from "@/components/publications";
import {
  fetchPublicationCategories,
  fetchPublications,
  filterPublications,
} from "@/lib/publications";
import type { PublicationContentType } from "@/lib/publication-content-types";
import { BookOpen } from "lucide-react";
import { listPageHead } from "@/lib/seo";

export const Route = createFileRoute("/publications")({
  head: () => listPageHead({ title: "Publications", description: "Research briefs, factsheets, reports, and community guides from CISC.", path: "/publications" }),
  component: PublicationsLayout,
});

function PublicationsLayout() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId === "/publications/$slug");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [contentType, setContentType] = useState<PublicationContentType | null>(null);

  const { data: publications, isLoading } = useQuery({
    queryKey: ["publications"],
    queryFn: () => fetchPublications(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["publication-categories"],
    queryFn: fetchPublicationCategories,
  });

  const filtered = useMemo(
    () => filterPublications(publications ?? [], search, categoryId, contentType),
    [publications, search, categoryId, contentType],
  );

  if (isChild) return <Outlet />;

  return (
    <PublicLayout>
      <PageContainer size="lg" className="space-y-8 pb-bottom-nav md:pb-[var(--page-py)]">
        <div>
          <p className="text-eyebrow grad-gold-text">Research & resources</p>
          <h1 className="mt-2 text-4xl font-black tracking-[var(--tracking-tight)] text-foreground sm:text-5xl">
            Publications Library
          </h1>
          {publications && publications.length > 0 && (
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              {publications.length} resource{publications.length === 1 ? "" : "s"} — factsheets, reports, magazines,
              videos, and extension bulletins.
            </p>
          )}
        </div>

        {isLoading ? (
          <LoadingState label="Loading publications…" />
        ) : !publications?.length ? (
          <EmptyState
            icon={BookOpen}
            title="Publications"
            description="Publications will appear here once published."
          />
        ) : (
          <>
            <PublicationFilters
              categories={categories}
              selectedCategoryId={categoryId}
              onCategoryChange={setCategoryId}
              selectedContentType={contentType}
              onContentTypeChange={setContentType}
              search={search}
              onSearchChange={setSearch}
            />

            {filtered.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No matches"
                description="Try a different search, category, or content type."
                action={
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary hover:underline"
                    onClick={() => {
                      setSearch("");
                      setCategoryId(null);
                      setContentType(null);
                    }}
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <>
                <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((publication) => (
                    <PublicationCard key={publication.id} publication={publication} />
                  ))}
                </div>
                <HorizontalScroll className="sm:hidden">
                  {filtered.map((publication) => (
                    <HorizontalScrollItem key={publication.id} width="lg">
                      <PublicationCard publication={publication} className="w-[85vw]" />
                    </HorizontalScrollItem>
                  ))}
                </HorizontalScroll>
              </>
            )}
          </>
        )}
      </PageContainer>
    </PublicLayout>
  );
}
