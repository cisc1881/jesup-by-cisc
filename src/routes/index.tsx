import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer, AppButton } from "@/components/design-system";
import { useHomeData } from "@/hooks/use-home-data";
import {
  CommunityImpactSection,
  FeaturedPodcastSection,
  FeaturedProgramsSection,
  HomeCtaSection,
  HomeHero,
  HomeQuickActionsSection,
  HomeWeatherSection,
  LatestPublicationsSection,
  NewsHomeSection,
  FarmersMarketsHomeSection,
  StrategicPartnersHomeSection,
  UpcomingEventsSection,
} from "@/components/home";
import { fetchHomePageData, createEmptyHomePageData, DEFAULT_SECTION_META } from "@/lib/home";
import { buildPageHead } from "@/lib/seo";
import { HOME_PAGE_QUERY_KEY } from "@/lib/query-config";

export const Route = createFileRoute("/")({
  head: () =>
    buildPageHead({
      title: "JESUP · The Digital Extension Wagon",
      description:
        "Programs, workshops, publications, and opportunities from the Carver Integrative Sustainability Center at Tuskegee University.",
      path: "/",
    }),
  loader: async ({ context: { queryClient } }) => {
    try {
      return await queryClient.ensureQueryData({
        queryKey: HOME_PAGE_QUERY_KEY,
        queryFn: fetchHomePageData,
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[home] loader failed; using empty homepage defaults", error);
      }
      const fallback = createEmptyHomePageData();
      queryClient.setQueryData(HOME_PAGE_QUERY_KEY, fallback);
      return fallback;
    }
  },
  errorComponent: HomeRouteError,
  component: Home,
});

function HomeRouteError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  return (
    <PublicLayout>
      <PageContainer size="md" className="py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Home is partially unavailable</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Some sections could not be loaded. You can retry or continue browsing other pages.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <AppButton
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </AppButton>
          <AppButton type="button" variant="outline" onClick={() => router.navigate({ to: "/programs" })}>
            Browse programs
          </AppButton>
        </div>
        {import.meta.env.DEV ? (
          <p className="mt-6 text-left text-xs text-muted-foreground">{error.message}</p>
        ) : null}
      </PageContainer>
    </PublicLayout>
  );
}

function Home() {
  const { data, isLoading } = useHomeData();
  const sections = data?.sections ?? DEFAULT_SECTION_META;

  return (
    <PublicLayout>
      <HomeHero slides={data?.heroSlides ?? []} />

      <PageContainer size="lg" className="space-y-[var(--space-10)] pb-[var(--space-12)] pt-[var(--space-6)] sm:space-y-[var(--space-12)] sm:pt-[var(--space-8)]">
        <HomeWeatherSection />
        <HomeQuickActionsSection />
        <FeaturedProgramsSection programs={data?.programs ?? []} meta={sections.programs} isLoading={isLoading} />
        <UpcomingEventsSection events={data?.events ?? []} meta={sections.events} isLoading={isLoading} />
        <LatestPublicationsSection publications={data?.publications ?? []} meta={sections.publications} isLoading={isLoading} />
        <NewsHomeSection
          featured={data?.featuredNews ?? null}
          latest={data?.latestNews ?? []}
          meta={sections.news}
          isLoading={isLoading}
        />
        <FeaturedPodcastSection episode={data?.featuredPodcast ?? null} meta={sections.podcast} isLoading={isLoading} />
        <StrategicPartnersHomeSection partners={data?.partners ?? []} meta={sections.partners} isLoading={isLoading} />
        <FarmersMarketsHomeSection markets={data?.markets ?? []} meta={sections.market} isLoading={isLoading} />
        <CommunityImpactSection stats={data?.impactStats ?? []} meta={sections.impact} isLoading={isLoading} />
        <HomeCtaSection cta={data?.cta ?? null} />
      </PageContainer>
    </PublicLayout>
  );
}
