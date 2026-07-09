import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import {
  FeaturedProgramHero,
  ProgramFilters,
  ProgramSectionRow,
  ProgramsEmptyState,
  ProgramsPageSkeleton,
  ProgramsPullRefresh,
  filterPrograms,
} from "@/components/programs";
import { fetchProgramCategories, fetchPrograms } from "@/lib/programs";
import type { ProgramListItem } from "@/lib/programs";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "Programs · JESUP" },
      { name: "description", content: "Signature programs from the Carver Integrative Sustainability Center." },
      { property: "og:title", content: "Programs · JESUP" },
    ],
  }),
  component: ProgramsLayout,
});

function partitionPrograms(programs: ProgramListItem[]) {
  const featured = programs.find((p) => p.isFeatured) ?? programs[0] ?? null;
  const rest = featured ? programs.filter((p) => p.id !== featured.id) : programs;

  const youth = rest.filter((p) => p.categorySlug === "youth");
  const research = rest.filter((p) => p.categorySlug === "research");
  const popular = rest.filter((p) => p.categorySlug !== "youth" && p.categorySlug !== "research");

  return { featured, popular, youth, research };
}

function ProgramsLayout() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId === "/programs/$slug");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const {
    data: programs,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["programs"],
    queryFn: () => fetchPrograms(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["program-categories"],
    queryFn: fetchProgramCategories,
  });

  const filtered = useMemo(
    () => filterPrograms(programs ?? [], search, categoryId),
    [programs, search, categoryId],
  );

  const sections = useMemo(() => partitionPrograms(filtered), [filtered]);
  const showInitialSkeleton = isLoading && !programs?.length;

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setCategoryId(null);
  }, []);

  if (isChild) return <Outlet />;

  return (
    <PublicLayout>
      <ProgramsPullRefresh onRefresh={handleRefresh} disabled={isFetching}>
        <PageContainer size="lg" className="space-y-8 pb-bottom-nav md:space-y-10 md:pb-[var(--page-py)]">
          <header className="space-y-3">
            <p className="text-eyebrow grad-gold-text">Signature initiatives</p>
            <h1 className="text-4xl font-black tracking-[var(--tracking-tight)] text-foreground sm:text-5xl">
              Programs
            </h1>
            {programs && programs.length > 0 && (
              <p className="max-w-2xl text-base text-muted-foreground">
                {filtered.length} of {programs.length} active program{programs.length === 1 ? "" : "s"} from the
                Carver Integrative Sustainability Center.
              </p>
            )}
          </header>

          {showInitialSkeleton ? (
            <ProgramsPageSkeleton />
          ) : !programs?.length ? (
            <ProgramsEmptyState variant="empty" />
          ) : (
            <>
              {filtered.length === 0 ? (
                <>
                  <ProgramFilters
                    categories={categories}
                    selectedCategoryId={categoryId}
                    onCategoryChange={setCategoryId}
                    search={search}
                    onSearchChange={setSearch}
                  />
                  <ProgramsEmptyState variant="no-results" onClearFilters={clearFilters} />
                </>
              ) : (
                <div className="space-y-10 md:space-y-12">
                  {sections.featured && <FeaturedProgramHero program={sections.featured} ctaMode="explore" />}

                  <ProgramFilters
                    categories={categories}
                    selectedCategoryId={categoryId}
                    onCategoryChange={setCategoryId}
                    search={search}
                    onSearchChange={setSearch}
                  />

                  <ProgramSectionRow
                    title="Popular Programs"
                    programs={sections.popular}
                    sectionId="popular-programs"
                    animationOffset={0}
                  />
                  <ProgramSectionRow
                    title="Youth Development"
                    programs={sections.youth}
                    sectionId="youth-programs"
                    animationOffset={3}
                  />
                  <ProgramSectionRow
                    title="Research"
                    programs={sections.research}
                    sectionId="research-programs"
                    animationOffset={6}
                  />
                </div>
              )}
            </>
          )}
        </PageContainer>
      </ProgramsPullRefresh>
    </PublicLayout>
  );
}
