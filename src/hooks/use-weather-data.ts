import { useCallback, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  WEATHER_ALERTS_STALE_MS,
  WEATHER_FORECAST_STALE_MS,
  WEATHER_REFRESH_MIN_INTERVAL_MS,
} from "@/lib/weather/constants";
import { buildCountyPreparedness } from "@/lib/weather/county-data";
import { DEMO_AGRICULTURE_DATA, DEMO_WEATHER_CENTER_DATA } from "@/lib/weather/mock-data";
import { buildNwsRadarInfo } from "@/lib/weather/radar";
import { fetchWeatherCenterServerFn } from "@/lib/weather/server-fn";
import type { StoredWeatherLocation, WeatherCenterData } from "@/lib/weather/types";
import { weatherCenterQueryKey } from "@/lib/query-config";
import { formatWeatherTime } from "@/components/weather/weather-icons";

type UseWeatherDataOptions = {
  location: StoredWeatherLocation;
  enabled?: boolean;
};

const locationFallback = { lat: 32.424, lon: -85.6916 };

function buildClientFallbackWeatherData(): WeatherCenterData {
  return {
    ...DEMO_WEATHER_CENTER_DATA,
    isDemo: true,
    isFallback: true,
    alerts: [],
    agriculture: DEMO_AGRICULTURE_DATA,
    countyPreparedness: buildCountyPreparedness("Macon County", "AL"),
    radar: buildNwsRadarInfo("BMX", { lat: locationFallback.lat, lon: locationFallback.lon }),
    coordinates: locationFallback,
    location: { ...DEMO_WEATHER_CENTER_DATA.location },
  };
}

export function useWeatherData({ location, enabled = true }: UseWeatherDataOptions) {
  const queryClient = useQueryClient();
  const lastRefreshRef = useRef(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshBlockedUntil, setRefreshBlockedUntil] = useState<number | null>(null);

  const query = useQuery({
    queryKey: weatherCenterQueryKey(location.lat, location.lon),
    queryFn: async (): Promise<WeatherCenterData> =>
      fetchWeatherCenterServerFn({
        data: { lat: location.lat, lon: location.lon },
      }),
    enabled,
    staleTime: WEATHER_ALERTS_STALE_MS,
    gcTime: WEATHER_FORECAST_STALE_MS,
    retry: 1,
    placeholderData: (previous) => previous,
  });

  const refreshWeather = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshRef.current < WEATHER_REFRESH_MIN_INTERVAL_MS) {
      setRefreshBlockedUntil(lastRefreshRef.current + WEATHER_REFRESH_MIN_INTERVAL_MS);
      return;
    }

    lastRefreshRef.current = now;
    setRefreshBlockedUntil(null);
    setIsRefreshing(true);

    try {
      await queryClient.invalidateQueries({
        queryKey: weatherCenterQueryKey(location.lat, location.lon),
        refetchType: "active",
      });
      await query.refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [location.lat, location.lon, query, queryClient]);

  const lastUpdatedLabel = query.data?.current.lastUpdated
    ? `Updated ${formatWeatherTime(query.data.current.lastUpdated)}`
    : undefined;

  return {
    ...query,
    isRefreshing,
    refreshBlockedUntil,
    refreshWeather,
    lastUpdatedLabel,
  };
}

export function resolveWeatherDisplayData(
  queryData: WeatherCenterData | undefined,
  isError: boolean,
): WeatherCenterData {
  if (queryData && !isError) return queryData;
  return buildClientFallbackWeatherData();
}
