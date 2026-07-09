import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import {
  FeaturedMarketHero,
  MarketFilters,
  MarketMapView,
  MarketSectionRow,
  MarketsEmptyState,
  MarketsPageSkeleton,
  MarketsPullRefresh,
  type MarketViewMode,
} from "@/components/markets";
import { useFavoriteMarkets } from "@/hooks/use-favorite-markets";
import { useUserLocation } from "@/hooks/use-user-location";
import {
  fetchMarketIdsByProductCategory,
  fetchMarkets,
  filterMarkets,
  partitionMarkets,
  type MarketProductCategory,
} from "@/lib/markets";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "Farmers Markets · JESUP" },
      {
        name: "description",
        content: "Find farmers markets near you — locally grown food, SNAP/EBT, and community agriculture from CISC.",
      },
      { property: "og:title", content: "Farmers Markets · JESUP" },
    ],
  }),
  component: MarketsPage,
});

function MarketsPage() {
  const [search, setSearch] = useState("");
  const [productCategory, setProductCategory] = useState<MarketProductCategory | null>(null);
  const [viewMode, setViewMode] = useState<MarketViewMode>("list");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { coords, loading: locating, denied, refresh } = useUserLocation();
  const { savedIds, toggleSaved, savedCount } = useFavoriteMarkets();

  const {
    data: markets,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["markets", coords?.lat, coords?.lng],
    queryFn: () => fetchMarkets({ coords }),
  });

  const { data: categoryMarketIds } = useQuery({
    queryKey: ["market-product-category", productCategory],
    enabled: !!productCategory,
    queryFn: () => fetchMarketIdsByProductCategory(productCategory!),
  });

  const filtered = useMemo(
    () =>
      filterMarkets(
        markets ?? [],
        search,
        productCategory,
        showFavoritesOnly,
        savedIds,
        productCategory ? categoryMarketIds : undefined,
      ),
    [markets, search, productCategory, showFavoritesOnly, savedIds, categoryMarketIds],
  );

  const sections = useMemo(() => partitionMarkets(filtered), [filtered]);
  const favoriteMarkets = useMemo(
    () => (markets ?? []).filter((m) => savedIds.has(m.id)),
    [markets, savedIds],
  );
  const showInitialSkeleton = isLoading && !markets?.length;

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setProductCategory(null);
    setShowFavoritesOnly(false);
    setViewMode("list");
  }, []);

  return (
    <PublicLayout>
      <MarketsPullRefresh onRefresh={handleRefresh} disabled={isFetching}>
        <PageContainer size="lg" className="space-y-8 pb-bottom-nav md:space-y-10 md:pb-[var(--page-py)]">
          <header className="space-y-3">
            <p className="text-eyebrow grad-gold-text">CISC Extension</p>
            <h1 className="text-4xl font-black tracking-[var(--tracking-tight)] text-foreground sm:text-5xl">
              Farmers Markets
            </h1>
            {markets && markets.length > 0 && (
              <p className="max-w-2xl text-base text-muted-foreground">
                {filtered.length} market{filtered.length === 1 ? "" : "s"} — fresh produce, local vendors, and
                community food access across Alabama.
                {coords && !denied && " Sorted by distance from you."}
              </p>
            )}
          </header>

          {showInitialSkeleton ? (
            <MarketsPageSkeleton />
          ) : !markets?.length ? (
            <MarketsEmptyState variant="empty" />
          ) : (
            <>
              {filtered.length === 0 ? (
                <>
                  <MarketFilters
                    search={search}
                    onSearchChange={setSearch}
                    productCategory={productCategory}
                    onProductCategoryChange={setProductCategory}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    showFavoritesOnly={showFavoritesOnly}
                    onShowFavoritesOnlyChange={setShowFavoritesOnly}
                    favoritesCount={savedCount}
                  />
                  <MarketsEmptyState
                    variant={showFavoritesOnly ? "favorites" : "no-results"}
                    onClearFilters={showFavoritesOnly ? undefined : clearFilters}
                  />
                </>
              ) : (
                <div className="space-y-10 md:space-y-12">
                  {sections.featured && viewMode === "list" && !showFavoritesOnly && (
                    <FeaturedMarketHero market={sections.featured} />
                  )}

                  <MarketFilters
                    search={search}
                    onSearchChange={setSearch}
                    productCategory={productCategory}
                    onProductCategoryChange={setProductCategory}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    showFavoritesOnly={showFavoritesOnly}
                    onShowFavoritesOnlyChange={setShowFavoritesOnly}
                    favoritesCount={savedCount}
                  />

                  {viewMode === "map" && (
                    <MarketMapView
                      markets={filtered}
                      userCoords={coords}
                      onLocate={refresh}
                      locating={locating}
                    />
                  )}

                  {viewMode === "list" && (
                    <>
                      {showFavoritesOnly ? (
                        <MarketSectionRow
                          title="Favorite Markets"
                          markets={filtered}
                          sectionId="favorite-markets"
                          savedIds={savedIds}
                          onToggleSaved={toggleSaved}
                        />
                      ) : (
                        <>
                          {favoriteMarkets.length > 0 && (
                            <MarketSectionRow
                              title="Favorite Markets"
                              markets={favoriteMarkets}
                              sectionId="favorite-markets"
                              savedIds={savedIds}
                              onToggleSaved={toggleSaved}
                            />
                          )}
                          <MarketSectionRow
                            title="Markets Near Me"
                            markets={sections.nearMe.slice(0, 12)}
                            sectionId="markets-near-me"
                            savedIds={savedIds}
                            onToggleSaved={toggleSaved}
                          />
                          <MarketSectionRow
                            title="Open Today"
                            markets={sections.openToday}
                            sectionId="open-today-markets"
                            animationOffset={1}
                            savedIds={savedIds}
                            onToggleSaved={toggleSaved}
                          />
                          <MarketSectionRow
                            title="This Weekend"
                            markets={sections.thisWeekend}
                            sectionId="weekend-markets"
                            animationOffset={2}
                            savedIds={savedIds}
                            onToggleSaved={toggleSaved}
                          />
                          <MarketSectionRow
                            title="Seasonal Markets"
                            markets={sections.seasonal}
                            sectionId="seasonal-markets"
                            animationOffset={3}
                            savedIds={savedIds}
                            onToggleSaved={toggleSaved}
                          />
                          <MarketSectionRow
                            title="All Markets"
                            markets={sections.other.length ? sections.other : filtered}
                            sectionId="all-markets"
                            animationOffset={4}
                            savedIds={savedIds}
                            onToggleSaved={toggleSaved}
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </PageContainer>
      </MarketsPullRefresh>
    </PublicLayout>
  );
}
