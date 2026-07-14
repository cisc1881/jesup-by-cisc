import type { WeatherRadarInfo } from "@/lib/weather/radar";
import type { WeatherCoordinates } from "@/lib/weather/types";
import { AppButton, AppCard, AppCardContent, AppCardHeader, AppCardTitle } from "@/components/design-system";
import { ExternalLink, Radar } from "lucide-react";

type WeatherRadarCardProps = {
  radar?: WeatherRadarInfo;
  coordinates?: WeatherCoordinates;
  isLoading?: boolean;
};

export function WeatherRadarCard({ radar, coordinates, isLoading }: WeatherRadarCardProps) {
  if (isLoading) {
    return (
      <AppCard padding="md" aria-busy="true" aria-label="Loading radar">
        <AppCardHeader>
          <AppCardTitle>Weather radar</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          <div className="aspect-video animate-pulse rounded-xl bg-secondary/60" />
        </AppCardContent>
      </AppCard>
    );
  }

  if (!radar?.available) {
    return (
      <AppCard padding="md">
        <AppCardHeader>
          <div className="flex items-center gap-2">
            <Radar className="size-5 text-accent" aria-hidden="true" />
            <AppCardTitle>Weather radar unavailable</AppCardTitle>
          </div>
        </AppCardHeader>
        <AppCardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Live radar is not available for this location. Use the official National Weather Service
            radar tools instead.
          </p>
          <AppButton asChild variant="outline" className="min-h-11">
            <a href="https://www.weather.gov/" target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden="true" />
              Open weather.gov radar
            </a>
          </AppButton>
        </AppCardContent>
      </AppCard>
    );
  }

  const officeLabel = radar.wfo ? `NWS ${radar.wfo}` : "National Weather Service";

  return (
    <AppCard padding="md">
      <AppCardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Radar className="size-5 text-accent" aria-hidden="true" />
          <AppCardTitle>Weather radar</AppCardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Provider-neutral radar access for {officeLabel}. Imagery is served by the National Weather
          Service — not a static screenshot.
        </p>
      </AppCardHeader>
      <AppCardContent className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-secondary/20">
          <div className="aspect-video flex items-center justify-center p-6 text-center">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Live radar for your selected area is available from the National Weather Service.
              </p>
              <p className="text-xs text-muted-foreground">
                {coordinates
                  ? `Near ${coordinates.lat.toFixed(2)}, ${coordinates.lon.toFixed(2)}`
                  : "Selected location"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <AppButton asChild className="min-h-11">
            <a href={radar.radarPageUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden="true" />
              Open NWS office radar
            </a>
          </AppButton>
          <AppButton asChild variant="outline" className="min-h-11">
            <a href={radar.openInNewWindowUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden="true" />
              Open live radar loop
            </a>
          </AppButton>
        </div>
        <p className="text-xs text-muted-foreground">{radar.attribution}</p>
      </AppCardContent>
    </AppCard>
  );
}
