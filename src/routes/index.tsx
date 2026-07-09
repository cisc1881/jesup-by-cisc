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
  FarmersMarketsHomeSection,
  UpcomingEventsSection,
} from "@/components/home";
import { fetchHomeSectionMeta } from "@/lib/home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JESUP · The Digital Extension Wagon" },
      {
        name: "description",
        content:
          "Programs, workshops, publications, and opportunities from the Carver Integrative Sustainability Center at Tuskegee University.",
      },
      { property: "og:title", content: "JESUP · The Digital Extension Wagon" },
      {
        property: "og:description",
        content: "A premium digital home for Tuskegee's Cooperative Extension programs.",
      },
    ],
  }),
  loader: () => fetchHomeSectionMeta(),
  component: Home,
});

function Home() {
  const sectionMeta = Route.useLoaderData();
  const { data, isLoading } = useHomeData();
  const sections = data?.sections ?? sectionMeta;

  return (
    <PublicLayout>
      <HomeHero slides={data?.heroSlides ?? []} />

      <PageContainer size="lg" className="space-y-[var(--space-10)] pb-[var(--space-12)] pt-[var(--space-6)] sm:space-y-[var(--space-12)] sm:pt-[var(--space-8)]">
        <HomeQuickActionsSection />
        <FeaturedProgramsSection programs={data?.programs ?? []} meta={sections.programs} isLoading={isLoading} />
        <UpcomingEventsSection events={data?.events ?? []} meta={sections.events} isLoading={isLoading} />
        <LatestPublicationsSection publications={data?.publications ?? []} meta={sections.publications} isLoading={isLoading} />
        <FeaturedPodcastSection episode={data?.featuredPodcast ?? null} meta={sections.podcast} isLoading={isLoading} />
        <FarmersMarketsHomeSection markets={data?.markets ?? []} meta={sections.market} isLoading={isLoading} />
        <CommunityImpactSection stats={data?.impactStats ?? []} meta={sections.impact} isLoading={isLoading} />
        <HomeCtaSection cta={data?.cta ?? null} />
      </PageContainer>
    </PublicLayout>
  );
}
