import type { WeatherCenterProps } from "@/lib/weather/types";
import { AppBadge, AppButton, SectionHeader } from "@/components/design-system";
import { CloudSun, Radio, RefreshCw } from "lucide-react";
import { AgriculturalInsightsCard } from "./agricultural-insights-card";
import { CountyPreparednessCard } from "./county-preparedness-card";
import { CurrentConditionsCard } from "./current-conditions-card";
import { ForecastStrip } from "./forecast-strip";
import { SevereAlertBanner } from "./severe-alert-banner";
import { WeatherAlertsEmptyState } from "./weather-alerts-empty";
import { WeatherEmptyState } from "./weather-empty-state";
import { WeatherLocationControl } from "./weather-location-control";
import { DemoDataLabel } from "./weather-metric";
import { WeatherRadarCard } from "./weather-radar-card";
import { WeatherSkeleton } from "./weather-skeleton";
import { WeatherStatusBanner } from "./weather-status-banner";
import { WeatherNotificationCta } from "./weather-notification-cta";

type WeatherCenterExtendedProps = WeatherCenterProps & {
  isEditingLocation?: boolean;
  onCloseLocationEditor?: () => void;
};

export function WeatherCenter({
  data,
  isLoading,
  status = "idle",
  locationSource = "default",
  errorMessage,
  onRequestLocation,
  onChangeLocation,
  onManualLocationSearch,
  onUseDefaultLocation,
  isSearchingLocation,
  isEditingLocation,
  onCloseLocationEditor,
  onRefreshWeather,
  isRefreshing,
  lastUpdatedLabel,
}: WeatherCenterExtendedProps) {
  const headingId = "home-weather-center-heading";

  if (isLoading) {
    return (
      <section aria-labelledby={headingId} aria-busy="true">
        <SectionHeader
          titleId={headingId}
          eyebrow="Community safety"
          title="Weather & Emergency Center"
          description="Loading conditions and preparedness guidance…"
        />
        <WeatherSkeleton />
      </section>
    );
  }

  if (!data) {
    return (
      <section aria-labelledby={headingId}>
        <SectionHeader
          titleId={headingId}
          eyebrow="Community safety"
          title="Weather & Emergency Center"
        />
        <WeatherEmptyState />
      </section>
    );
  }

  const showDemoLabel = data.isDemo || data.isFallback;
  const showLiveLabel = !data.isDemo && !data.isFallback;

  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <SectionHeader
        titleId={headingId}
        eyebrow="Community safety"
        title="Weather & Emergency Center"
        description="Local conditions, severe weather awareness, and county preparedness for your community."
        action={
          <div className="flex shrink-0 items-center gap-2">
            {showLiveLabel ? (
              <AppBadge variant="secondary" className="gap-1">
                <Radio className="size-3.5" aria-hidden="true" />
                Live NWS data
              </AppBadge>
            ) : null}
            {showDemoLabel ? (
              <>
                <CloudSun className="size-5 text-accent" aria-hidden="true" />
                <DemoDataLabel />
              </>
            ) : null}
          </div>
        }
      />

      <WeatherStatusBanner status={status} message={errorMessage} />

      <WeatherNotificationCta />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {lastUpdatedLabel ?? "Weather updates from the U.S. National Weather Service"}
        </p>
        <AppButton
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          onClick={onRefreshWeather}
          disabled={isRefreshing}
          aria-busy={isRefreshing}
        >
          <RefreshCw className={isRefreshing ? "motion-safe:animate-spin" : ""} aria-hidden="true" />
          {isRefreshing ? "Refreshing…" : "Refresh weather"}
        </AppButton>
      </div>

      <WeatherLocationControl
        locationSource={locationSource}
        locationLabel={data.location.label}
        county={data.location.county}
        isEditing={Boolean(isEditingLocation)}
        isSearching={isSearchingLocation}
        onRequestLocation={onRequestLocation ?? (() => undefined)}
        onSearchLocation={onManualLocationSearch ?? (async () => undefined)}
        onUseDefault={onUseDefaultLocation ?? (() => undefined)}
        onOpenEditor={onChangeLocation ?? (() => undefined)}
        onCloseEditor={onCloseLocationEditor ?? (() => undefined)}
      />

      {data.isDemo || data.isFallback ? (
        <p className="mb-4 rounded-xl border border-dashed border-border/80 bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
          <strong className="font-semibold text-foreground">
            {data.isFallback ? "Fallback mode: " : "Development preview: "}
          </strong>
          {data.isFallback
            ? "Live weather providers were unavailable. Demonstration or partial content may be shown. Do not treat alerts as live emergency warnings."
            : "Agricultural insights remain demonstration content until live Extension and USDA sources are connected."}
        </p>
      ) : null}

      {data.alerts.length > 0 ? (
        <div className="mb-6 space-y-3" role="group" aria-label="Severe weather alerts">
          {data.alerts.map((alert) => (
            <SevereAlertBanner key={alert.id} alert={alert} showDemoLabel={showDemoLabel} />
          ))}
        </div>
      ) : !showDemoLabel ? (
        <WeatherAlertsEmptyState />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <CurrentConditionsCard location={data.location} current={data.current} />
        <CountyPreparednessCard
          preparedness={data.countyPreparedness}
          onChangeCounty={onChangeLocation}
        />
      </div>

      <div className="mt-6 min-w-0">
        <ForecastStrip days={data.forecast} />
      </div>

      <div className="mt-6">
        <WeatherRadarCard
          radar={data.radar}
          coordinates={data.coordinates}
          isLoading={isRefreshing}
        />
      </div>

      <div className="mt-6">
        <AgriculturalInsightsCard insights={data.agriculture} showDemoLabel />
      </div>
    </section>
  );
}
