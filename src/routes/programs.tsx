import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer, QueryErrorState } from "@/components/design-system";
import {
  ProgramFilters,
  ProgramsEmptyState,
  ProgramsPageSkeleton,
  ProgramsPullRefresh,
  filterPrograms,
} from "@/components/programs";
import { DirectoryResultList } from "@/components/directory-result-list";
import { fetchProgramCategories, fetchPrograms } from "@/lib/programs";
import type { ProgramListItem } from "@/lib/programs";
import { listPageHead } from "@/lib/seo";
import { useInstitutionTheme } from "@/components/institution-theme-provider";
import {
  InstitutionScopeFilter,
  matchesInstitutionScope,
  type InstitutionScope,
} from "@/components/institution-scope-filter";

export const Route = createFileRoute("/programs")({
  head: () => {
    const head = listPageHead({
      title: "Programs",
      description: "Signature programs from the Carver Integrative Sustainability Center.",
      path: "/programs",
    });
    return { ...head, meta: head.meta.filter((meta) => !meta.property?.startsWith("og:image") && meta.name !== "twitter:image") };
  },
  component: ProgramsLayout,
});

function ProgramsLayout() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId === "/programs/$slug");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const { institutionId, institutionName } = useInstitutionTheme();
  const [institutionScope, setInstitutionScope] = useState<InstitutionScope>(
    institutionId ? "mine" : "all",
  );

  const {
    data: programs,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery<ProgramListItem[]>({
    queryKey: ["programs"],
    queryFn: () => fetchPrograms(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["program-categories"],
    queryFn: fetchProgramCategories,
  });

  const relevantPrograms = useMemo(
    () =>
      (programs ?? []).filter((program) =>
        matchesInstitutionScope(program, institutionScope, institutionId),
      ),
    [programs, institutionId, institutionScope],
  );
  const filtered = useMemo(
    () => filterPrograms(relevantPrograms, search, categoryId),
    [relevantPrograms, search, categoryId],
  );

  const showInitialSkeleton = isLoading && !(programs ?? []).length;

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
        <PageContainer
          size="lg"
          className="space-y-8 pb-bottom-nav md:space-y-10 md:pb-[var(--page-py)]"
        >
          <header className="space-y-3">
            <p className="text-eyebrow grad-gold-text">Signature initiatives</p>
            <h1 className="text-4xl font-black tracking-[var(--tracking-tight)] text-foreground sm:text-5xl">
              Programs
            </h1>
            {programs && programs.length > 0 && (
              <p className="max-w-2xl text-base text-muted-foreground">
                {filtered.length} of {relevantPrograms.length} active program
                {relevantPrograms.length === 1 ? "" : "s"} for{" "}
                {institutionName ?? "the 1890 network"}.
              </p>
            )}
          </header>

          <InstitutionScopeFilter
            value={institutionScope}
            onChange={setInstitutionScope}
            hasInstitution={!!institutionId}
          />

          {showInitialSkeleton ? (
            <ProgramsPageSkeleton />
          ) : isError ? (
            <QueryErrorState title="Couldn't load programs" onRetry={() => refetch()} />
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
                <div className="space-y-6">
                  <ProgramFilters
                    categories={categories}
                    selectedCategoryId={categoryId}
                    onCategoryChange={setCategoryId}
                    search={search}
                    onSearchChange={setSearch}
                  />

                  <DirectoryResultList
                    title="Programs"
                    className="-mx-[var(--page-px)] sm:mx-0"
                    results={filtered.map((program) => ({
                      id: program.id,
                      title: program.name,
                      subtitle: program.tagline ?? program.short,
                      detail: program.categoryName,
                      imageUrl: program.coverImageUrl,
                      to: "/programs/$slug" as const,
                      params: { slug: program.slug },
                    }))}
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
