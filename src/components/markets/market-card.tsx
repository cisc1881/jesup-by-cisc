import { Link } from "@tanstack/react-router";
import { Bookmark, Clock, MapPin } from "lucide-react";
import type { MarketListItem } from "@/lib/markets";
import { formatMarketAddress } from "@/lib/markets";
import { formatDistance } from "@/lib/market-geo";
import { AppBadge, AppButton, AppCard } from "@/components/design-system";
import { cn } from "@/lib/utils";

type MarketCardProps = {
  market: MarketListItem;
  className?: string;
  animationIndex?: number;
  saved?: boolean;
  onToggleSaved?: () => void;
};

export function MarketCard({ market, className, animationIndex = 0, saved, onToggleSaved }: MarketCardProps) {
  const address = formatMarketAddress(market);

  return (
    <AppCard
      variant="lift"
      padding="none"
      className={cn(
        "group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-token-lift active:scale-[0.98] animate-fade-up",
        className,
      )}
      style={{ animationDelay: `${animationIndex * 90}ms` }}
    >
      <Link
        to="/markets/$id"
        params={{ id: market.id }}
        className="absolute inset-0 z-[1] rounded-[inherit]"
        aria-label={`View ${market.name}`}
      />

      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {market.coverImageUrl ? (
          <img
            src={market.coverImageUrl}
            alt={market.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full grad-crimson" />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.5) 100%)" }}
        />
        {market.isOpenToday && (
          <span className="pointer-events-none absolute left-3 top-3 glass-surface-dark rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Open today
          </span>
        )}
        {onToggleSaved && (
          <button
            type="button"
            onClick={onToggleSaved}
            className={cn(
              "absolute right-3 top-3 z-[2] grid h-10 w-10 place-items-center rounded-full glass-surface transition",
              saved && "text-accent",
            )}
            aria-label={saved ? "Remove favorite" : "Favorite market"}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </button>
        )}
        {market.distanceKm != null && (
          <span className="pointer-events-none absolute bottom-3 left-3 glass-surface rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            {formatDistance(market.distanceKm)}
          </span>
        )}
      </div>

      <div className="relative z-0 flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-2">
          {market.acceptsSnapEbt && <AppBadge variant="gold">SNAP/EBT</AppBadge>}
          {market.season && <AppBadge variant="outline">{market.season}</AppBadge>}
        </div>
        <h3 className="mt-2 line-clamp-2 text-lg font-black tracking-[var(--tracking-tight)] text-foreground">
          {market.name}
        </h3>
        {address && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="line-clamp-2">{address}</span>
          </p>
        )}
        {market.hours && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">{market.hours}</span>
          </p>
        )}
        <div className="mt-auto pt-4">
          <AppButton variant="outline" size="sm" shape="pill" className="pointer-events-none w-full">
            View Market
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
}
