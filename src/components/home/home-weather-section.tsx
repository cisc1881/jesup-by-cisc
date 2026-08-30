import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { CloudSun, LocateFixed } from "lucide-react";
import { useWeatherData, resolveWeatherDisplayData } from "@/hooks/use-weather-data";
import { useWeatherLocation } from "@/hooks/use-weather-location";
import { AppButton } from "@/components/design-system";
import { WeatherCenter } from "@/components/weather";
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
      <div className="institution-surface-secondary flex min-h-20 items-center border-l-[6px] border-[var(--institution-accent)] px-4 py-3 sm:px-6">
        {isLoading && !displayData ? (
          <div
            className="h-7 w-full animate-pulse bg-muted"
            role="status"
            aria-label="Loading local forecast"
          />
        ) : displayData ? (
          <Link to="/weather" className="flex min-w-0 flex-1 items-center gap-3">
            <WeatherConditionIcon
              code={displayData.current.conditionCode}
              label={displayData.current.condition}
              className="size-8 shrink-0 institution-accent-text"
            />
            <span className="min-w-0 flex-1">
              <span id="local-forecast-title" className="block truncate text-sm font-bold">
                {displayData.location.label} · {displayData.current.condition}
              </span>
              <span className="block text-xs text-muted-foreground">Local weather</span>
            </span>
            <span className="text-3xl font-black tabular-nums">
              {displayData.current.temperatureF}°
            </span>
          </Link>
        ) : (
          <div className="flex w-full items-center gap-3">
            <CloudSun className="size-7 institution-accent-text" />
            <span className="flex-1 text-sm font-bold">Weather near you</span>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={locationState.requestLiveLocation}
            >
              <LocateFixed className="size-4" aria-hidden="true" />
              Use my location
            </AppButton>
          </div>
        )}
      </div>
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
