import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo } from "react";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer, AppButton } from "@/components/design-system";
import { useHomeData } from "@/hooks/use-home-data";
import {
  HomeHero,
  HomeWeatherSection,
  MyJesupHomeSection,
  UpcomingEventsSection,
} from "@/components/home";
import { fetchHomePageData, createEmptyHomePageData, DEFAULT_SECTION_META } from "@/lib/home";
import { buildPageHead } from "@/lib/seo";
import { HOME_PAGE_QUERY_KEY } from "@/lib/query-config";
import { useInstitutionTheme } from "@/components/institution-theme-provider";

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
  const data = queryData ?? loaderData;
  const sections = data?.sections ?? DEFAULT_SECTION_META;
  const { institutionId } = useInstitutionTheme();
  const relevantEvents = useMemo(
    () =>
      (data?.events ?? []).filter(
        (event) =>
          !institutionId || event.networkWide || event.institutionIds.includes(institutionId),
      ),
    [data?.events, institutionId],
  );
  const relevantSlides = useMemo(
    () =>
      (data?.heroSlides ?? []).filter(
        (slide) =>
          !institutionId ||
          slide.networkWide !== false ||
          slide.institutionIds?.includes(institutionId),
      ),
    [data?.heroSlides, institutionId],
  );

  return (
    <PublicLayout>
      <HomeHero slides={relevantSlides} />

      <PageContainer
        size="lg"
        className="space-y-[var(--space-10)] pb-[var(--space-12)] pt-[var(--space-6)] sm:space-y-[var(--space-12)] sm:pt-[var(--space-8)]"
      >
        <MyJesupHomeSection />
        <HomeWeatherSection />
        <UpcomingEventsSection
          events={relevantEvents}
          meta={sections.events}
          isLoading={isLoading}
        />
      </PageContainer>
    </PublicLayout>
  );
}
