import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, ExternalLink, MapPin } from "lucide-react";
import type { HomeMarket, HomeSectionMeta } from "@/lib/home";
import { pickNearestMarket } from "@/lib/home";
import { AppButton, AppCard, EmptyState, HomeSection, SectionActionLink } from "@/components/design-system";

type NearbyMarketSectionProps = {
  markets: HomeMarket[];
  meta: HomeSectionMeta;
  isLoading?: boolean;
};

function formatAddress(m: HomeMarket) {
  return [m.address, m.city, m.state].filter(Boolean).join(", ");
}

export function NearbyMarketSection({ markets, meta, isLoading }: NearbyMarketSectionProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { maximumAge: 300_000, timeout: 8000 },
    );
  }, []);

  const market = useMemo(() => pickNearestMarket(markets, coords), [markets, coords]);
  const mapsQuery = market ? formatAddress(market) : "";

  if (isLoading) {
    return (
      <HomeSection sectionId={meta.id} meta={meta}>
        <AppCard variant="elevated" padding="none" className="overflow-hidden">
          <div className="h-40 animate-pulse bg-secondary" />
        </AppCard>
      </HomeSection>
    );
  }

  if (!market) {
    return (
      <HomeSection sectionId={meta.id} meta={meta}>
        <EmptyState
          icon={MapPin}
          title={meta.emptyTitle ?? meta.title}
          description={meta.emptyDescription ?? undefined}
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
      <AppCard variant="lift" padding="none" className="overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-secondary sm:w-48 md:w-56">
            {market.imageUrl ? (
              <img src={market.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="h-full w-full grad-crimson opacity-90" aria-hidden="true" />
            )}
          </div>
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <h3 className="text-xl font-black tracking-[var(--tracking-tight)] text-foreground">{market.name}</h3>
            {market.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{market.description}</p>
            )}
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {mapsQuery && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <span>{mapsQuery}</span>
                </li>
              )}
              {market.hours && (
                <li className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <span>{market.hours}</span>
                </li>
              )}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {meta.viewAllRoute && (
                <AppButton variant="outline" size="sm" shape="pill" asChild>
                  <Link to={meta.viewAllRoute}>{meta.viewAllLabel ?? meta.title}</Link>
                </AppButton>
              )}
              {mapsQuery && (
                <AppButton variant="ghost" size="sm" shape="pill" asChild>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(mapsQuery)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {market.name} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </AppButton>
              )}
            </div>
          </div>
        </div>
      </AppCard>
    </HomeSection>
  );
}
