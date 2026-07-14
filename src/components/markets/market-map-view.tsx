import { useMemo, useState } from "react";
import type { MarketListItem } from "@/lib/markets";
import { formatMarketAddress } from "@/lib/markets";
import { formatDistance, googleMapsDirectionsUrl, googleMapsEmbedUrl } from "@/lib/market-geo";
import { AppButton } from "@/components/design-system";
import { cn } from "@/lib/utils";
import { Crosshair, ExternalLink, MapPin, Navigation } from "lucide-react";

type MarketMapViewProps = {
  markets: MarketListItem[];
  userCoords?: { lat: number; lng: number } | null;
  onLocate?: () => void;
  locating?: boolean;
  className?: string;
};

export function MarketMapView({ markets, userCoords, onLocate, locating, className }: MarketMapViewProps) {
  const mapped = useMemo(() => markets.filter((m) => m.lat != null && m.lng != null), [markets]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = mapped.find((m) => m.id === selectedId) ?? mapped[0] ?? null;

  const mapCenter = useMemo(() => {
    if (selected?.lat != null && selected.lng != null) {
      return { lat: selected.lat, lng: selected.lng };
    }
    if (userCoords) return userCoords;
    if (mapped[0]?.lat != null && mapped[0].lng != null) {
      return { lat: mapped[0].lat, lng: mapped[0].lng };
    }
    return null;
  }, [mapped, selected, userCoords]);

  return (
    <div className={cn("space-y-4", className)}>
      {mapped.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card px-6 py-12 text-center shadow-token-soft">
          <MapPin className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">
            No mapped market locations yet. Add coordinates in the Command Center.
          </p>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-3xl border border-border/60 shadow-token-lift">
            {mapCenter && (
              <iframe
                title="Farmers markets map"
                className="h-[min(52vh,420px)] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={googleMapsEmbedUrl(mapCenter.lat, mapCenter.lng, 12)}
              />
            )}
            {onLocate && (
              <AppButton
                variant="inverse"
                size="sm"
                shape="pill"
                className="absolute bottom-4 right-4 shadow-token-lift"
                onClick={onLocate}
                disabled={locating}
              >
                <Crosshair className="h-4 w-4" />
                {locating ? "Locating…" : "My location"}
              </AppButton>
            )}
          </div>

          <div className="space-y-3">
            {mapped.map((market) => {
              const active = selected?.id === market.id;
              const address = formatMarketAddress(market);
              return (
                <button
                  key={market.id}
                  type="button"
                  onClick={() => setSelectedId(market.id)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition-all duration-200",
                    active
                      ? "border-primary/40 bg-primary/5 shadow-token-soft"
                      : "border-border/60 bg-card shadow-token-soft hover:shadow-token-lift",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground">{market.name}</h3>
                      {address && <p className="mt-1 text-sm text-muted-foreground">{address}</p>}
                      {market.distanceKm != null && (
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">
                          {formatDistance(market.distanceKm)}
                        </p>
                      )}
                    </div>
                    <AppButton variant="outline" size="sm" shape="pill" asChild>
                      <a href={googleMapsDirectionsUrl(market)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                        <Navigation className="h-4 w-4" />
                        Directions
                      </a>
                    </AppButton>
                  </div>
                  {active && market.lat != null && market.lng != null && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-border/50">
                      <iframe
                        title={`Map for ${market.name}`}
                        className="h-48 w-full"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={googleMapsEmbedUrl(market.lat, market.lng, 15)}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {userCoords && (
            <AppButton variant="ghost" size="sm" shape="pill" className="w-fit" asChild>
              <a
                href={`https://www.google.com/maps/@${userCoords.lat},${userCoords.lng},14z`}
                target="_blank"
                rel="noreferrer"
              >
                Open in Google Maps <ExternalLink className="h-4 w-4" />
              </a>
            </AppButton>
          )}
        </>
      )}
    </div>
  );
}
