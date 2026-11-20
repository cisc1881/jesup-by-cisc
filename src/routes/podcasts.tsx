import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Mic, Play } from "lucide-react";
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
import { fetchPodcasts, filterPodcasts } from "@/lib/podcasts";
import {
  TWO_FAS_PODCAST_IMAGE,
  TWO_FAS_PODCAST_SLUG,
  TWO_FAS_SPOTIFY_EMBED_URL,
  TWO_FAS_SPOTIFY_URL,
} from "@/lib/2fas-podcast";
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

  const {
    data: episodes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["podcasts"],
    queryFn: () => fetchPodcasts(),
  });

  const catalogEpisodes = useMemo(
    () => (episodes ?? []).filter((episode) => episode.slug !== TWO_FAS_PODCAST_SLUG),
    [episodes],
  );

  const categories = useMemo(() => {
    const set = new Set(catalogEpisodes.map((e) => e.category).filter(Boolean) as string[]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [catalogEpisodes]);

  const filtered = useMemo(
    () => filterPodcasts(catalogEpisodes, search, category),
    [catalogEpisodes, search, category],
  );

  const heroEpisode = useMemo(() => {
    const list = catalogEpisodes;
    return list.find((e) => e.isFeatured) ?? list[0] ?? null;
  }, [catalogEpisodes]);

  if (isChild) return <Outlet />;

  const heroAlt = "The 2FAS Podcast cover art";

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-foreground text-white">
        <div className="absolute inset-0 opacity-40">
          <img
            src={TWO_FAS_PODCAST_IMAGE}
            alt={heroAlt}
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/55"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:flex-row sm:items-end sm:px-6 sm:py-20">
          <div className="relative h-52 w-52 shrink-0 overflow-hidden rounded-3xl shadow-2xl sm:h-64 sm:w-64">
            <img
              src={TWO_FAS_PODCAST_IMAGE}
              alt={heroAlt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] grad-gold-text">
              Tuskegee University · CISC
            </p>
            <h1 className="text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">
              The 2FAS Podcast
            </h1>
            <p className="mt-3 max-w-xl text-white/80">
              Health, science, agriculture, and culture from the Carver Integrative Sustainability
              Center.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <AppButton variant="inverse" size="lg" shape="pill" asChild>
                <a href={TWO_FAS_SPOTIFY_URL} target="_blank" rel="noopener noreferrer">
                  Listen on Spotify <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </AppButton>
              {heroEpisode && (
                <AppButton variant="secondary" size="lg" shape="pill" asChild>
                  <Link to="/podcasts/$slug" params={{ slug: heroEpisode.slug }}>
                    <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                    Featured JESUP episode
                  </Link>
                </AppButton>
              )}
            </div>
          </div>
        </div>
      </section>

      <PageContainer size="lg" className="space-y-8 pb-bottom-nav pt-10 md:pb-[var(--page-py)]">
        <section aria-labelledby="two-fas-listen-heading" className="space-y-4">
          <div>
            <h2 id="two-fas-listen-heading" className="text-2xl font-bold text-foreground">
              Listen to 2FAS
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Episodes from the Tuskegee University and CISC podcast.
            </p>
          </div>
          <iframe
            title="The 2FAS Podcast on Spotify"
            src={TWO_FAS_SPOTIFY_EMBED_URL}
            className="h-[352px] w-full rounded-2xl border-0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </section>
        {isLoading ? (
          <LoadingState label="Loading episodes…" />
        ) : isError ? (
          <QueryErrorState title="Couldn't load podcasts" onRetry={() => refetch()} />
        ) : !catalogEpisodes.length ? (
          <EmptyState
            icon={Mic}
            title="More JESUP episodes coming soon"
            description="Listen to 2FAS above while we add more episodes to the JESUP catalog."
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

            {filtered.length === 0 ? (
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
                  {filtered.map((episode) => (
                    <PodcastCard key={episode.id} episode={episode} />
                  ))}
                </div>
                <HorizontalScroll className="sm:hidden" aria-label="Podcast episodes">
                  {filtered.map((episode) => (
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
