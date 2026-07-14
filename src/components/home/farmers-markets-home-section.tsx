import { useMemo } from "react";
import type { HomeSectionMeta } from "@/lib/home";
import type { MarketListItem } from "@/lib/markets";
import { partitionMarkets } from "@/lib/markets";
import { useFavoriteMarkets } from "@/hooks/use-favorite-markets";
import { useUserLocation } from "@/hooks/use-user-location";
import { FeaturedMarketHero } from "@/components/markets/featured-market-hero";
import { MarketSectionRow } from "@/components/markets/market-section-row";
import { EmptyState, HomeSection, SectionActionLink } from "@/components/design-system";
import { Store } from "lucide-react";

type FarmersMarketsHomeSectionProps = {
  markets: MarketListItem[];
  meta: HomeSectionMeta;
  isLoading?: boolean;
};

export function FarmersMarketsHomeSection({ markets, meta, isLoading }: FarmersMarketsHomeSectionProps) {
  const { coords } = useUserLocation();
  const { savedIds, toggleSaved } = useFavoriteMarkets();

  const withDistance = useMemo(() => {
    if (!coords) return markets;
    return [...markets].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [markets, coords]);

  const sections = useMemo(() => partitionMarkets(withDistance), [withDistance]);
  const favorites = useMemo(() => withDistance.filter((m) => savedIds.has(m.id)), [withDistance, savedIds]);

  if (isLoading) {
    return (
      <HomeSection sectionId={meta.id} meta={meta}>
        <div className="h-48 animate-pulse rounded-3xl bg-secondary" />
      </HomeSection>
    );
  }

  if (markets.length === 0) {
    return (
      <HomeSection sectionId={meta.id} meta={meta}>
        <EmptyState
          icon={Store}
          title={meta.emptyTitle ?? "Farmers markets"}
          description={meta.emptyDescription ?? "Local market listings will appear here once published."}
          action={
            meta.viewAllRoute && meta.viewAllLabel ? (
              <SectionActionLink to={meta.viewAllRoute}>{meta.viewAllLabel}</SectionActionLink>
            ) : undefined
          }
        />
      </HomeSection>
    );
  }

  return (
    <HomeSection sectionId={meta.id} meta={meta}>
      <div className="space-y-10">
        {sections.featured && <FeaturedMarketHero market={sections.featured} />}
        {favorites.length > 0 && (
          <MarketSectionRow
            title="Favorite Markets"
            markets={favorites.slice(0, 8)}
            savedIds={savedIds}
            onToggleSaved={toggleSaved}
          />
        )}
        <MarketSectionRow
          title="Markets Near Me"
          markets={sections.nearMe.slice(0, 8)}
          savedIds={savedIds}
          onToggleSaved={toggleSaved}
        />
        <MarketSectionRow
          title="Open Today"
          markets={sections.openToday.slice(0, 8)}
          savedIds={savedIds}
          onToggleSaved={toggleSaved}
        />
        <MarketSectionRow
          title="This Weekend"
          markets={sections.thisWeekend.slice(0, 8)}
          savedIds={savedIds}
          onToggleSaved={toggleSaved}
        />
        <MarketSectionRow
          title="Seasonal Markets"
          markets={sections.seasonal.slice(0, 8)}
          savedIds={savedIds}
          onToggleSaved={toggleSaved}
        />
        {meta.viewAllRoute && (
          <div className="flex justify-center pt-2">
            <SectionActionLink to={meta.viewAllRoute}>Explore all farmers markets →</SectionActionLink>
          </div>
        )}
      </div>
    </HomeSection>
  );
}
