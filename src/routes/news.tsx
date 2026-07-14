import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Newspaper } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import {
  EmptyState,
  HorizontalScroll,
  HorizontalScrollItem,
  LoadingState,
  PageContainer,
  QueryErrorState,
  SectionHeader,
} from "@/components/design-system";
import { NewsCard, NewsFilters, NewsPageHero } from "@/components/news";
import { NEWS_CATEGORIES } from "@/lib/news-categories";
import { fetchNewsArticles, filterNewsArticles } from "@/lib/news";
import { listPageHead } from "@/lib/seo";

export const Route = createFileRoute("/news")({
  head: () =>
    listPageHead({
      title: "News & Stories",
      description:
        "Stay informed about CISC programs, research, Extension activities, student success, and community impact.",
      path: "/news",
    }),
  component: NewsLayout,
});

function NewsLayout() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId === "/news/$slug");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const { data: articles, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["news"],
    queryFn: () => fetchNewsArticles(),
  });

  const categories = useMemo(() => ["All", ...NEWS_CATEGORIES], []);

  const filtered = useMemo(
    () => filterNewsArticles(articles ?? [], search, category === "All" ? null : category),
    [articles, search, category],
  );

  const featuredArticle = useMemo(() => {
    const list = articles ?? [];
    return list.find((a) => a.isFeatured) ?? list[0] ?? null;
  }, [articles]);

  const listArticles = useMemo(() => {
    if (!featuredArticle) return filtered;
    if (search || category !== "All") return filtered;
    return filtered.filter((a) => a.id !== featuredArticle.id);
  }, [filtered, featuredArticle, search, category]);

  if (isChild) return <Outlet />;

  return (
    <PublicLayout>
      <NewsPageHero />
      <PageContainer size="lg" className="space-y-8 pb-bottom-nav pt-10 md:pb-[var(--page-py)]">
        {isLoading ? (
          <LoadingState label="Loading news…" />
        ) : isError ? (
          <QueryErrorState title="Couldn't load news" onRetry={() => refetch()} />
        ) : !articles?.length ? (
          <EmptyState
            icon={Newspaper}
            title="Stories coming soon"
            description="News and stories from CISC will appear here once published in the Command Center."
          />
        ) : (
          <>
            {featuredArticle && !search && category === "All" && (
              <section className="space-y-4">
                <SectionHeader title="Featured story" titleClassName="text-2xl sm:text-3xl" />
                <NewsCard article={featuredArticle} variant="featured" />
              </section>
            )}

            <NewsFilters
              categories={categories}
              selectedCategory={category}
              onCategoryChange={setCategory}
              search={search}
              onSearchChange={setSearch}
            />

            {isFetching && !isLoading && (
              <p className="text-center text-xs text-muted-foreground" role="status" aria-live="polite">
                Refreshing…
              </p>
            )}

            {listArticles.length === 0 ? (
              <EmptyState
                icon={Newspaper}
                title="No matches"
                description="Try a different search or category."
                action={
                  <button
                    type="button"
                    className="min-h-[44px] text-sm font-semibold text-primary hover:underline"
                    onClick={() => {
                      setSearch("");
                      setCategory("All");
                    }}
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <section className="space-y-4">
                <SectionHeader title="Latest news" titleClassName="text-2xl sm:text-3xl" />
                <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                  {listArticles.map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
                <HorizontalScroll className="sm:hidden" aria-label="Latest news stories">
                  {listArticles.map((article) => (
                    <HorizontalScrollItem key={article.id} width="lg">
                      <NewsCard article={article} className="w-[85vw]" />
                    </HorizontalScrollItem>
                  ))}
                </HorizontalScroll>
              </section>
            )}
          </>
        )}
      </PageContainer>
    </PublicLayout>
  );
}
