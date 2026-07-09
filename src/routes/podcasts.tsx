import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic, Play } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import {
  AppButton,
  EmptyState,
  HorizontalScroll,
  HorizontalScrollItem,
  LoadingState,
  PageContainer,
  QueryErrorState,
} from "@/components/design-system";
import { PodcastCard, PodcastFilters } from "@/components/podcasts";
import podcastHero from "@/assets/jesup/podcast-hero.jpg";
import { fetchPodcasts, filterPodcasts } from "@/lib/podcasts";
import { listPageHead } from "@/lib/seo";

export const Route = createFileRoute("/podcasts")({
  head: () =>
    listPageHead({
      title: "Podcasts",
      description: "Conversations from the field — the JESUP podcast from CISC.",
      path: "/podcasts",
    }),
  component: PodcastsLayout,
});

function PodcastsLayout() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId === "/podcasts/$slug");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const { data: episodes, isLoading, isError, refetch } = useQuery({
    queryKey: ["podcasts"],
    queryFn: () => fetchPodcasts(),
  });

  const categories = useMemo(() => {
    const set = new Set((episodes ?? []).map((e) => e.category).filter(Boolean) as string[]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [episodes]);

  const filtered = useMemo(
    () => filterPodcasts(episodes ?? [], search, category),
    [episodes, search, category],
  );

  const heroEpisode = useMemo(() => {
    const list = episodes ?? [];
    return list.find((e) => e.isFeatured) ?? list[0] ?? null;
  }, [episodes]);

  const listEpisodes = useMemo(() => {
    if (!heroEpisode) return filtered;
    if (search || category) return filtered;
    return filtered.filter((ep) => ep.id !== heroEpisode.id);
  }, [filtered, heroEpisode, search, category]);

  if (isChild) return <Outlet />;

  const heroAlt = heroEpisode?.title ?? "JESUP podcast cover art";

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-foreground text-white">
        <div className="absolute inset-0 opacity-40">
          <img
            src={heroEpisode?.coverUrl || podcastHero}
            alt={heroAlt}
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/85 to-foreground/40" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:flex-row sm:items-end sm:px-6 sm:py-20">
          <div className="relative h-52 w-52 shrink-0 overflow-hidden rounded-3xl shadow-2xl sm:h-64 sm:w-64">
            <img
              src={heroEpisode?.coverUrl || podcastHero}
              alt={heroAlt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] grad-gold-text">
              Podcast · JESUP
            </p>
            <h1 className="text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">
              Conversations from the field
            </h1>
            <p className="mt-3 max-w-xl text-white/80">
              Stories with farmers, researchers, and community leaders — hosted by the Carver Integrative
              Sustainability Center.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {heroEpisode && (
                <AppButton variant="inverse" size="lg" shape="pill" asChild>
                  <Link to="/podcasts/$slug" params={{ slug: heroEpisode.slug }}>
                    <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                    {heroEpisode.isFeatured ? "Featured episode" : "Latest episode"}
                  </Link>
                </AppButton>
              )}
              <div className="text-xs text-white/70">
                {episodes?.length ?? 0} episode{(episodes?.length ?? 0) === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PageContainer size="lg" className="space-y-8 pb-bottom-nav pt-10 md:pb-[var(--page-py)]">
        {isLoading ? (
          <LoadingState label="Loading episodes…" />
        ) : isError ? (
          <QueryErrorState title="Couldn't load podcasts" onRetry={() => refetch()} />
        ) : !episodes?.length ? (
          <EmptyState
            icon={Mic}
            title="Episodes coming soon"
            description="Our first drop is in production. Check back for field notes from CISC."
          />
        ) : (
          <>
            <PodcastFilters
              categories={categories}
              selectedCategory={category}
              onCategoryChange={setCategory}
              search={search}
              onSearchChange={setSearch}
            />

            {listEpisodes.length === 0 ? (
              <EmptyState
                icon={Mic}
                title="No matches"
                description="Try a different search or category."
                action={
                  <button
                    type="button"
                    className="min-h-[44px] text-sm font-semibold text-primary hover:underline"
                    onClick={() => {
                      setSearch("");
                      setCategory(null);
                    }}
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <>
                <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                  {listEpisodes.map((episode) => (
                    <PodcastCard key={episode.id} episode={episode} />
                  ))}
                </div>
                <HorizontalScroll className="sm:hidden" aria-label="Podcast episodes">
                  {listEpisodes.map((episode) => (
                    <HorizontalScrollItem key={episode.id} width="lg">
                      <PodcastCard episode={episode} className="w-[85vw]" />
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
