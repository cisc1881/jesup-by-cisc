import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import type { MarketListItem } from "@/lib/markets";
import { formatMarketAddress } from "@/lib/markets";
import { formatDistance } from "@/lib/market-geo";
import { AppBadge, AppButton } from "@/components/design-system";

type FeaturedMarketHeroProps = {
  market: MarketListItem;
};

export function FeaturedMarketHero({ market }: FeaturedMarketHeroProps) {
  const address = formatMarketAddress(market);

  return (
    <section className="relative isolate animate-fade-up overflow-hidden rounded-3xl shadow-token-crimson">
      <div className="relative min-h-[360px] w-full overflow-hidden bg-secondary sm:min-h-[440px]">
        {market.coverImageUrl ? (
          <img src={market.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
        ) : (
          <div className="absolute inset-0 grad-crimson" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(122,12,22,0.45) 50%, rgba(122,12,22,0.96) 100%)",
          }}
        />
        <div className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
          <span className="glass-surface-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Featured market
          </span>
        </div>
        <div className="relative z-10 flex min-h-[360px] flex-col justify-end p-6 sm:min-h-[440px] sm:p-10">
          <div className="flex flex-wrap gap-2">
            {market.isOpenToday && <AppBadge variant="gold">Open today</AppBadge>}
            {market.acceptsSnapEbt && <AppBadge variant="gold">SNAP/EBT</AppBadge>}
          </div>
          <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[var(--tracking-tight)] text-white sm:text-5xl">
            {market.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-white/90">
            {address && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
                {address}
              </span>
            )}
            {market.distanceKm != null && <span>{formatDistance(market.distanceKm)} away</span>}
          </div>
          {market.season && <p className="mt-3 text-sm text-white/85">{market.season}</p>}
          <div className="mt-6">
            <AppButton variant="inverse" size="lg" shape="pill" asChild>
              <Link to="/markets/$id" params={{ id: market.id }}>
                Explore market <ArrowRight className="h-4 w-4" />
              </Link>
            </AppButton>
          </div>
        </div>
      </div>
    </section>
  );
}
