import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { EmptyState, LoadingState, PageContainer } from "@/components/design-system";
import {
  PartnerCard,
  PartnerFilters,
  PartnerImpactStats,
  PartnersPageHero,
} from "@/components/partners";
import { partnerFilterCategories } from "@/lib/partner-categories";
import {
  fetchPartnerImpactCounts,
  fetchPartners,
  filterPartners,
  sortPartners,
  type PartnerSortMode,
} from "@/lib/partners";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Strategic Partners · JESUP" },
      {
        name: "description",
        content:
          "Universities, federal agencies, foundations, and community organizations collaborating with CISC through JESUP.",
      },
      { property: "og:title", content: "Strategic Partners · JESUP" },
    ],
  }),
  component: PartnersLayout,
});

function PartnersLayout() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId === "/partners/$slug");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [focusArea, setFocusArea] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<PartnerSortMode>("featured");

  const { data: partners, isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: () => fetchPartners(),
  });

  const { data: impactCounts } = useQuery({
    queryKey: ["partner-impact-counts"],
    queryFn: fetchPartnerImpactCounts,
    enabled: !isChild,
  });

  const categories = useMemo(
    () => partnerFilterCategories((partners ?? []).map((p) => p.category)),
    [partners],
  );

  const filtered = useMemo(() => {
    const list = filterPartners(partners ?? [], search, category === "All" ? null : category, focusArea);
    return sortPartners(list, sortMode);
  }, [partners, search, category, focusArea, sortMode]);

  if (isChild) return <Outlet />;

  return (
    <PublicLayout>
      <PartnersPageHero />
      <PageContainer size="lg" className="space-y-8 pb-bottom-nav pt-10 md:pb-[var(--page-py)]">
        {impactCounts && <PartnerImpactStats counts={impactCounts} />}

        {isLoading ? (
          <LoadingState label="Loading partners…" />
        ) : !partners?.length ? (
          <EmptyState
            icon={Building2}
            title="Partners coming soon"
            description="Strategic partners will appear here once published in the Command Center."
          />
        ) : (
          <>
            <PartnerFilters
              categories={categories}
              selectedCategory={category}
              onCategoryChange={setCategory}
              selectedFocusArea={focusArea}
              onFocusAreaChange={setFocusArea}
              sortMode={sortMode}
              onSortModeChange={setSortMode}
              search={search}
              onSearchChange={setSearch}
            />

            {filtered.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No matches"
                description="Try a different search, category, or partnership focus area."
                action={
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary hover:underline"
                    onClick={() => {
                      setSearch("");
                      setCategory("All");
                      setFocusArea(null);
                    }}
                  >
                    Clear filters
                  </button>
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            )}
          </>
        )}
      </PageContainer>
    </PublicLayout>
  );
}
