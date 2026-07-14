import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { CloudSun, LocateFixed, MapPin } from "lucide-react";
import { useWeatherData, resolveWeatherDisplayData } from "@/hooks/use-weather-data";
import { useWeatherLocation } from "@/hooks/use-weather-location";
import { AppButton, AppCard } from "@/components/design-system";
import { ForecastStrip, WeatherCenter } from "@/components/weather";
import { WeatherConditionIcon } from "@/components/weather/weather-icons";
import type { WeatherCenterStatus } from "@/lib/weather/types";

function useWeatherCenterState() {
  const locationState = useWeatherLocation();
  const weatherQuery = useWeatherData({
    location: locationState.location,
    enabled: locationState.status !== "requesting-permission",
  });
  const displayData = resolveWeatherDisplayData(weatherQuery.data, weatherQuery.isError);

  const status: WeatherCenterStatus = useMemo(() => {
    if (locationState.status === "requesting-permission") return "requesting-permission";
    if (locationState.status === "permission-denied") return "permission-denied";
    if (weatherQuery.isLoading && !weatherQuery.data) return "loading";
    if (weatherQuery.isFetching || weatherQuery.isRefreshing) return "loading";
    if (weatherQuery.isError) return "fallback";
    if (weatherQuery.isSuccess) return "live";
    if (locationState.status === "provider-error") return "provider-error";
    return "idle";
  }, [locationState.status, weatherQuery]);

  return { locationState, weatherQuery, displayData, status };
}

export function HomeWeatherSection() {
  const { locationState, weatherQuery, displayData, status } = useWeatherCenterState();
  const isLoading = status === "loading" || status === "requesting-permission";

  return (
    <section aria-labelledby="local-forecast-title">
      <AppCard padding="md" className="overflow-hidden border-primary/10 bg-gradient-to-br from-card to-secondary/35">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <CloudSun className="size-4" aria-hidden="true" />
              Local forecast
            </div>
            <h2 id="local-forecast-title" className="mt-2 text-2xl font-black tracking-tight">
              {displayData?.location.label ?? "Weather near you"}
            </h2>
            {displayData ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" aria-hidden="true" />
                {displayData.location.county}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <AppButton type="button" variant="outline" size="sm" onClick={locationState.requestLiveLocation}>
              <LocateFixed className="size-4" aria-hidden="true" />
              Use my location
            </AppButton>
            <AppButton asChild variant="ghost" size="sm">
              <Link to="/resources" hash="weather-emergency">Weather resources</Link>
            </AppButton>
          </div>
        </div>

        {isLoading && !displayData ? (
          <div className="mt-6 h-32 animate-pulse rounded-2xl bg-muted" role="status" aria-label="Loading local forecast" />
        ) : displayData ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[14rem_1fr] lg:items-center">
            <div className="flex items-center gap-4">
              <WeatherConditionIcon
                code={displayData.current.conditionCode}
                label={displayData.current.condition}
                className="size-14 shrink-0 text-accent"
              />
              <div>
                <p className="text-4xl font-black tabular-nums">{displayData.current.temperatureF}°F</p>
                <p className="text-sm text-muted-foreground">{displayData.current.condition}</p>
              </div>
            </div>
            <ForecastStrip days={displayData.forecast.slice(0, 5)} />
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">Choose your location to view the forecast.</p>
        )}
      </AppCard>
    </section>
  );
}

export function WeatherResourceCenter() {
  const { locationState, weatherQuery, displayData, status } = useWeatherCenterState();
  const errorMessage =
    locationState.errorMessage ??
    (weatherQuery.error instanceof Error ? weatherQuery.error.message : undefined);

  return (
    <WeatherCenter
      data={displayData}
      isLoading={(status === "loading" && !weatherQuery.data) || status === "requesting-permission"}
      status={status}
      locationSource={locationState.locationSource}
      errorMessage={errorMessage}
      onRequestLocation={locationState.requestLiveLocation}
      onChangeLocation={locationState.openLocationEditor}
      onManualLocationSearch={locationState.searchManualLocation}
      onUseDefaultLocation={locationState.useDefaultLocation}
      isSearchingLocation={locationState.isSearchingLocation}
      isEditingLocation={locationState.isEditingLocation}
      onCloseLocationEditor={locationState.closeLocationEditor}
      onRefreshWeather={weatherQuery.refreshWeather}
      isRefreshing={weatherQuery.isRefreshing}
      lastUpdatedLabel={weatherQuery.lastUpdatedLabel}
    />
  );
}
