import { NWS_API_BASE, SERVER_CACHE_TTL, WEATHER_USER_AGENT } from "../constants";
import { getWeatherCache, normalizeCacheKey } from "../cache-factory";
import { WeatherServiceError } from "../errors";
import { withTransientRetry } from "../rate-limit";

export type NwsPointsProperties = {
  gridId: string;
  gridX: number;
  gridY: number;
  forecast: string;
  forecastHourly: string;
  observationStations: string;
  relativeLocation?: {
    properties?: {
      city?: string;
      state?: string;
    };
  };
};

export type NwsForecastPeriod = {
  number: number;
  name: string;
  startTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  detailedForecast: string;
  probabilityOfPrecipitation?: { value: number | null };
  windSpeed: string;
  windDirection: string;
};

export type NwsAlertProperties = {
  id: string;
  event?: string;
  severity?: string;
  urgency?: string;
  headline?: string;
  description?: string;
  instruction?: string;
  effective?: string;
  expires?: string;
  onset?: string;
  ends?: string;
  senderName?: string;
};

export type NwsObservationProperties = {
  timestamp?: string;
  temperature?: { value: number | null; unitCode?: string };
  heatIndex?: { value: number | null; unitCode?: string };
  windChill?: { value: number | null; unitCode?: string };
  relativeHumidity?: { value: number | null };
  windSpeed?: { value: number | null; unitCode?: string };
  windDirection?: { value: number | null };
  textDescription?: string;
};

type NwsPointsResponse = { properties: NwsPointsProperties };
type NwsForecastResponse = { properties: { periods: NwsForecastPeriod[] } };
type NwsAlertsResponse = { features: Array<{ properties: NwsAlertProperties }> };
type NwsStationsResponse = { features: Array<{ properties: { stationIdentifier: string } }> };
type NwsObservationResponse = { properties: NwsObservationProperties };

function roundCoord(value: number): string {
  return value.toFixed(4);
}

async function nwsFetch<T>(url: string, errorCode: WeatherServiceError["code"]): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/geo+json, application/json",
        "User-Agent": WEATHER_USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new WeatherServiceError(errorCode, `NWS request failed (${response.status}) for ${url}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    throw new WeatherServiceError("provider-offline", "Weather provider is unavailable.", error);
  }
}

export async function fetchNwsPoints(lat: number, lon: number): Promise<NwsPointsProperties> {
  const cacheKey = normalizeCacheKey(["nws", "points", roundCoord(lat), roundCoord(lon)]);
  const cache = getWeatherCache();
  const cached = await cache.get<NwsPointsProperties>(cacheKey);
  if (cached) return cached;

  const url = `${NWS_API_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
  const data = await withTransientRetry(() => nwsFetch<NwsPointsResponse>(url, "nws-points-failed"));
  await cache.set(cacheKey, data.properties, { ttlMs: SERVER_CACHE_TTL.points, allowStaleOnError: true });
  return data.properties;
}

export async function fetchNwsForecast(forecastUrl: string): Promise<NwsForecastPeriod[]> {
  const cacheKey = normalizeCacheKey(["nws", "forecast", forecastUrl]);
  const cache = getWeatherCache();
  const cached = await cache.get<NwsForecastPeriod[]>(cacheKey);
  if (cached) return cached;

  const data = await withTransientRetry(() => nwsFetch<NwsForecastResponse>(forecastUrl, "nws-forecast-failed"));
  await cache.set(cacheKey, data.properties.periods, { ttlMs: SERVER_CACHE_TTL.forecast, allowStaleOnError: true });
  return data.properties.periods;
}

export async function fetchNwsHourlyForecast(hourlyUrl: string): Promise<NwsForecastPeriod[]> {
  const cacheKey = normalizeCacheKey(["nws", "hourly", hourlyUrl]);
  const cache = getWeatherCache();
  const cached = await cache.get<NwsForecastPeriod[]>(cacheKey);
  if (cached) return cached;

  const data = await withTransientRetry(() => nwsFetch<NwsForecastResponse>(hourlyUrl, "nws-forecast-failed"));
  await cache.set(cacheKey, data.properties.periods, { ttlMs: SERVER_CACHE_TTL.current, allowStaleOnError: true });
  return data.properties.periods;
}

export async function fetchNwsActiveAlerts(lat: number, lon: number): Promise<NwsAlertProperties[]> {
  const cacheKey = normalizeCacheKey(["nws", "alerts", roundCoord(lat), roundCoord(lon)]);
  const cache = getWeatherCache();
  const cached = await cache.get<NwsAlertProperties[]>(cacheKey);
  if (cached) return cached;

  const url = `${NWS_API_BASE}/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`;
  const data = await withTransientRetry(() => nwsFetch<NwsAlertsResponse>(url, "nws-alerts-failed"));
  const alerts = data.features.map((feature) => feature.properties);
  await cache.set(cacheKey, alerts, { ttlMs: SERVER_CACHE_TTL.alerts });
  return alerts;
}

export async function fetchLatestObservation(
  observationStationsUrl: string,
): Promise<NwsObservationProperties | null> {
  const stations = await nwsFetch<NwsStationsResponse>(
    observationStationsUrl,
    "nws-observation-failed",
  );
  const stationId = stations.features[0]?.properties.stationIdentifier;
  if (!stationId) return null;

  const cacheKey = normalizeCacheKey(["nws", "obs", stationId]);
  const cache = getWeatherCache();
  const cached = await cache.get<NwsObservationProperties>(cacheKey);
  if (cached) return cached;

  const url = `${NWS_API_BASE}/stations/${stationId}/observations/latest`;
  try {
    const data = await nwsFetch<NwsObservationResponse>(url, "nws-observation-failed");
    await cache.set(cacheKey, data.properties, { ttlMs: SERVER_CACHE_TTL.current, allowStaleOnError: true });
    return data.properties;
  } catch {
    return null;
  }
}
