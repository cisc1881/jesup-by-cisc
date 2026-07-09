import type { MarketListItem } from "@/lib/markets";
import { HorizontalScroll, HorizontalScrollItem, SectionHeader } from "@/components/design-system";
import { MarketCard } from "@/components/markets/market-card";

type MarketSectionRowProps = {
  title: string;
  markets: MarketListItem[];
  sectionId?: string;
  animationOffset?: number;
  savedIds?: Set<string>;
  onToggleSaved?: (marketId: string) => void;
};

export function MarketSectionRow({
  title,
  markets,
  sectionId,
  animationOffset = 0,
  savedIds,
  onToggleSaved,
}: MarketSectionRowProps) {
  if (markets.length === 0) return null;

  const headingId = sectionId ?? `markets-section-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section aria-labelledby={headingId} className="space-y-5 animate-fade-up">
      <SectionHeader title={title} titleId={headingId} />
      <div className="gold-divider" />
      <HorizontalScroll gap="md">
        {markets.map((market, index) => (
          <HorizontalScrollItem key={market.id} width="md">
            <MarketCard
              market={market}
              animationIndex={animationOffset + index}
              className="w-[78vw] sm:w-72"
              saved={savedIds?.has(market.id)}
              onToggleSaved={onToggleSaved ? () => onToggleSaved(market.id) : undefined}
            />
          </HorizontalScrollItem>
        ))}
      </HorizontalScroll>
    </section>
  );
}
