import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import { useHomeData } from "@/hooks/use-home-data";
import {
  CommunityImpactSection,
  FeaturedPodcastSection,
  FeaturedProgramsSection,
  HomeCtaSection,
  HomeHero,
  HomeQuickActionsSection,
  LatestPublicationsSection,
  NewsHomeSection,
  FarmersMarketsHomeSection,
  StrategicPartnersHomeSection,
  UpcomingEventsSection,
} from "@/components/home";
import { fetchHomePageData, DEFAULT_SECTION_META } from "@/lib/home";
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
    return queryClient.ensureQueryData({
      queryKey: HOME_PAGE_QUERY_KEY,
      queryFn: fetchHomePageData,
    });
  },
  component: Home,
});

function Home() {
  const { data, isLoading } = useHomeData();
  const sections = data?.sections ?? DEFAULT_SECTION_META;

  return (
    <PublicLayout>
      <HomeHero slides={data?.heroSlides ?? []} />

      <PageContainer size="lg" className="space-y-[var(--space-10)] pb-[var(--space-12)] pt-[var(--space-6)] sm:space-y-[var(--space-12)] sm:pt-[var(--space-8)]">
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
