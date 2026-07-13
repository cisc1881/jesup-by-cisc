import { useMemo } from "react";
import { useWeatherData, resolveWeatherDisplayData } from "@/hooks/use-weather-data";
import { useWeatherLocation } from "@/hooks/use-weather-location";
import { WeatherCenter } from "@/components/weather";
import type { WeatherCenterStatus } from "@/lib/weather/types";

export function HomeWeatherSection() {
  const {
    location,
    locationSource,
    status: locationStatus,
    errorMessage: locationError,
    isSearchingLocation,
    requestLiveLocation,
    searchManualLocation,
    useDefaultLocation,
    openLocationEditor,
    closeLocationEditor,
    isEditingLocation,
  } = useWeatherLocation();

  const weatherQuery = useWeatherData({
    location,
    enabled: locationStatus !== "requesting-permission",
  });

  const displayData = resolveWeatherDisplayData(weatherQuery.data, weatherQuery.isError);

  const status: WeatherCenterStatus = useMemo(() => {
    if (locationStatus === "requesting-permission") return "requesting-permission";
    if (locationStatus === "permission-denied") return "permission-denied";
    if (weatherQuery.isLoading && !weatherQuery.data) return "loading";
    if (weatherQuery.isFetching || weatherQuery.isRefreshing) return "loading";
    if (weatherQuery.isError && !weatherQuery.data) return "fallback";
    if (weatherQuery.isError) return "fallback";
    if (weatherQuery.isSuccess) return "live";
    if (locationStatus === "provider-error") return "provider-error";
    return "idle";
  }, [
    locationStatus,
    weatherQuery.isLoading,
    weatherQuery.isFetching,
    weatherQuery.isRefreshing,
    weatherQuery.isError,
    weatherQuery.isSuccess,
    weatherQuery.data,
  ]);

  const errorMessage =
    locationError ??
    (weatherQuery.error instanceof Error ? weatherQuery.error.message : undefined);

  const showInitialSkeleton = status === "loading" && !weatherQuery.data;

  return (
    <WeatherCenter
      data={displayData}
      isLoading={showInitialSkeleton || status === "requesting-permission"}
      status={status}
      locationSource={locationSource}
      errorMessage={errorMessage}
      onRequestLocation={requestLiveLocation}
      onChangeLocation={openLocationEditor}
      onManualLocationSearch={searchManualLocation}
      onUseDefaultLocation={useDefaultLocation}
      isSearchingLocation={isSearchingLocation}
      isEditingLocation={isEditingLocation}
      onCloseLocationEditor={closeLocationEditor}
      onRefreshWeather={weatherQuery.refreshWeather}
      isRefreshing={weatherQuery.isRefreshing}
      lastUpdatedLabel={weatherQuery.lastUpdatedLabel}
    />
  );
}
