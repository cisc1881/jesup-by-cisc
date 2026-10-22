import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo } from "react";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer, AppButton } from "@/components/design-system";
import { useHomeData } from "@/hooks/use-home-data";
import {
  HomeHero,
  HomeWeatherSection,
  EventDiscoveryHomeSection,
  FeaturedProgramsSection,
  UpcomingEventsSection,
} from "@/components/home";
import { fetchHomePageData, createEmptyHomePageData, DEFAULT_SECTION_META } from "@/lib/home";
import type { HomeEvent, HomeHeroSlide, HomePageData } from "@/lib/home";
import { buildPageHead } from "@/lib/seo";
import { HOME_PAGE_QUERY_KEY } from "@/lib/query-config";
import { useInstitutionTheme } from "@/components/institution-theme-provider";
import { fetchEventById, type EventDetail } from "@/lib/events";
import { conferenceHead } from "@/lib/conference";
import { ConferenceHero } from "@/components/events/conference-hero";

export const Route = createFileRoute("/")({
  loader: async ({ context: { queryClient } }): Promise<{ home: HomePageData; pilot: EventDetail | null }> => {
    try {
      const home = await queryClient.ensureQueryData({
        queryKey: HOME_PAGE_QUERY_KEY,
        queryFn: fetchHomePageData,
      });
      const pilot = await fetchEventById("fc135");
      return { home, pilot };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[home] loader failed; using empty homepage defaults", error);
      }
      const fallback = createEmptyHomePageData();
      queryClient.setQueryData(HOME_PAGE_QUERY_KEY, fallback);
      return { home: fallback, pilot: null };
    }
  },
  head: ({ loaderData }) => loaderData?.pilot ? conferenceHead(loaderData.pilot) :
    buildPageHead({ title: "JESUP by CISC · The Digital Extension Wagon", description: "Tuskegee University’s digital home for extension events, programs, markets, and trusted resources." }),
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
          <AppButton
            type="button"
            variant="outline"
            onClick={() => router.navigate({ to: "/programs" })}
          >
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
  const loaderData = Route.useLoaderData();
  const { data: queryData, isLoading } = useHomeData();
  const data: HomePageData | undefined = queryData ?? loaderData?.home;
  const sections = data?.sections ?? DEFAULT_SECTION_META;
  const { institutionId } = useInstitutionTheme();
  const relevantEvents = useMemo(
    () =>
      (data?.events ?? []).filter(
        (event: HomeEvent) =>
          !institutionId || event.networkWide || event.institutionIds.includes(institutionId),
      ),
    [data?.events, institutionId],
  );
  const relevantSlides = useMemo(() => {
    const aboutSlide: HomeHeroSlide = {
      id: "about-jesup",
      imageUrl: "",
      imageAlt: "About JESUP and the Digital Extension Wagon",
      title: "The extension wagon—reimagined for a connected world.",
      subtitle:
        "Meet JESUP, the new Digital Extension Wagon connecting the 1890 Land-Grant network to events, programs, knowledge, and opportunity.",
      linkTo: "/about",
      linkLabel: "About JESUP",
      networkWide: true,
      institutionIds: [],
    };
    const filtered = (data?.heroSlides ?? []).filter(
      (slide: HomeHeroSlide) =>
        !institutionId ||
        slide.networkWide !== false ||
        slide.institutionIds?.includes(institutionId),
    );
    return [aboutSlide, ...filtered].slice(0, 5);
  }, [data?.heroSlides, institutionId]);

  return (
    <PublicLayout>
      {loaderData?.pilot ? <PageContainer size="lg"><div className="conference-shell" data-event-theme={loaderData.pilot.metadata.theme_preset === "tuskegee" ? "tuskegee" : "network"}><ConferenceHero event={loaderData.pilot} entry /></div></PageContainer> : <HomeHero slides={relevantSlides} />}

      <PageContainer
        size="lg"
        className="space-y-10 pb-[var(--space-12)] pt-[var(--space-6)] sm:space-y-12 sm:pt-[var(--space-8)]"
      >
        <HomeWeatherSection />
        <EventDiscoveryHomeSection />
        <UpcomingEventsSection
          events={relevantEvents}
          meta={{ ...sections.events, title: "Upcoming for you" }}
          isLoading={isLoading && !data}
        />
        <FeaturedProgramsSection
          programs={data?.programs ?? []}
          meta={sections.programs}
          isLoading={isLoading && !data}
        />
      </PageContainer>
    </PublicLayout>
  );
}
