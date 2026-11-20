import { createFileRoute, Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer, AppButton } from "@/components/design-system";
import { useHomeData } from "@/hooks/use-home-data";
import {
  HomeHero,
  FeaturedProgramsSection,
  MyJesupHomeSection,
  NewsHomeSection,
  FeaturedPodcastSection,
} from "@/components/home";
import { fetchHomePageData, createEmptyHomePageData, DEFAULT_SECTION_META } from "@/lib/home";
import type { HomeHeroSlide, HomePageData } from "@/lib/home";
import { buildPageHead } from "@/lib/seo";
import { HOME_PAGE_QUERY_KEY } from "@/lib/query-config";
import { ContentThemeScope, useInstitutionTheme } from "@/components/institution-theme-provider";
import type { EventDetail } from "@/lib/events";
import { getPublicEvent } from "@/lib/public-events.functions";
import { eventDateLabel } from "@/lib/conference";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import aboutHeroAsset from "@/assets/jesup-about-hero-2026-10-23.png.asset.json";
import { JesupToday } from "@/components/home/jesup-today";
import { DashboardShortcuts } from "@/components/home/dashboard-shortcuts";
import { ProgramRequests } from "@/components/home/program-requests";

export const Route = createFileRoute("/")({
  loader: async ({
    context: { queryClient },
  }): Promise<{ home: HomePageData; pilot: EventDetail | null }> => {
    try {
      const home = await queryClient.ensureQueryData({
        queryKey: HOME_PAGE_QUERY_KEY,
        queryFn: fetchHomePageData,
      });
      const pilot = JSON.parse(
        await getPublicEvent({ data: { id: "fc135" } }),
      ) as EventDetail | null;
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
  head: () => {
    const head = buildPageHead({
      title: "JESUP · The Digital Extension Wagon",
      description:
        "Connect with extension knowledge, programs, publications, markets, and the 135th Annual Farmers Conference through JESUP.",
      path: "/",
    });
    return {
      ...head,
      meta: head.meta.filter(
        (meta) => !meta.property?.startsWith("og:image") && meta.name !== "twitter:image",
      ),
    };
  },
  errorComponent: HomeRouteError,
  component: Home,
});

function HomeRouteError({ error, reset }: ErrorComponentProps) {
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
          <p className="mt-6 text-left text-xs text-muted-foreground">
            {error instanceof Error ? error.message : String(error)}
          </p>
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
  const { user } = useAuth();
  const relevantSlides = useMemo(() => {
    const aboutSlide: HomeHeroSlide = {
      id: "about-jesup",
      imageUrl: aboutHeroAsset.url,
      imageAlt: "About Jesup",
      title: "JESUP",
      subtitle:
        "The Digital Extension Wagon. Rooted in Tuskegee’s extension legacy, connecting people to knowledge, programs, and opportunity today.",
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
    const pilot = loaderData.pilot;
    const eventSlides: HomeHeroSlide[] = pilot
      ? [
          {
            id: "featured-fc135",
            imageUrl: "/images/content/fc135-conference-art.jpg",
            imageAlt: "135th Farmers Conference artwork",
            title: pilot.title,
            subtitle: `${eventDateLabel(pilot)} · ${pilot.location ?? ""}`,
            linkTo: "/events/$id",
            linkParams: { id: pilot.slug },
            linkLabel: "Explore FC135",
            networkWide: true,
            institutionIds: [],
          },
        ]
      : [];
    const directorySlides: HomeHeroSlide[] = [
      {
        id: "programs",
        imageUrl: "/images/content/chfp.jpg",
        imageAlt: "Community health and farming program",
        title: "Programs & research",
        subtitle: "Connect with extension programs and research initiatives across the network.",
        linkTo: "/programs",
        linkLabel: "Explore programs",
        networkWide: true,
      },
      {
        id: "publications",
        imageUrl: "/images/content/state-of-african-americans-black-belt.jpg",
        imageAlt: "Families in the Black Belt",
        title: "Knowledge to take with you",
        subtitle: "Find publications and practical resources to inform your work and community.",
        linkTo: "/publications",
        linkLabel: "Browse publications",
        networkWide: true,
      },
    ];
    return [aboutSlide, ...eventSlides, ...directorySlides, ...filtered].slice(0, 6);
  }, [data?.heroSlides, institutionId, loaderData.pilot]);

  return (
    <PublicLayout>
      {!user && <HomeHero slides={relevantSlides} />}

      {loaderData.pilot && (
        <ContentThemeScope content={loaderData.pilot}>
          <section aria-label="Featured conference" className="brand-banner border-b border-border">
            <PageContainer
              size="lg"
              className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold text-banner-highlight">
                  Featured event · FC135
                </p>
                <h2 className="text-lg font-semibold text-banner-foreground">
                  {loaderData.pilot.title}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-banner-foreground">
                  <CalendarDays className="size-4 shrink-0" />
                  {eventDateLabel(loaderData.pilot)}
                </p>
              </div>
              <AppButton asChild variant="secondary" shape="square" className="w-fit shrink-0">
                <Link to="/events/$id" params={{ id: loaderData.pilot.slug }}>
                  Explore FC135 <ArrowUpRight />
                </Link>
              </AppButton>
            </PageContainer>
          </section>
        </ContentThemeScope>
      )}

      <PageContainer
        size="lg"
        className="space-y-10 pb-[var(--space-12)] pt-[var(--space-6)] sm:space-y-12 sm:pt-[var(--space-8)]"
      >
        <JesupToday events={data?.events ?? []} />
        <DashboardShortcuts />
        {user && <MyJesupHomeSection />}
        {user && <ProgramRequests />}
        {!user && (
          <FeaturedProgramsSection
            programs={data?.programs ?? []}
            meta={{ ...sections.programs, title: "Programs" }}
            isLoading={isLoading && !data}
          />
        )}
        {(data?.featuredNews || (data?.latestNews.length ?? 0) > 0) && (
          <NewsHomeSection
            featured={data?.featuredNews ?? null}
            latest={data?.latestNews ?? []}
            meta={sections.news}
            isLoading={isLoading && !data}
          />
        )}
        <FeaturedPodcastSection
          episode={data?.featuredPodcast ?? null}
          meta={{ ...sections.podcast, title: "Listen next" }}
          isLoading={isLoading && !data}
        />
      </PageContainer>
    </PublicLayout>
  );
}
