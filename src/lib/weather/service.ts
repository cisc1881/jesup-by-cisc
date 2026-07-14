import { resolveCountyPreparedness } from "./county-directory-service";
import { buildCountyPreparedness } from "./county-data";
import { DEMO_AGRICULTURE_DATA, DEMO_WEATHER_CENTER_DATA } from "./mock-data";
import { buildNwsRadarInfo } from "./radar";
import { WeatherServiceError } from "./errors";
import {
  mapGeocodedPlaceToLocation,
  mapHourlyToCurrent,
  mapNwsAlerts,
  mapNwsForecastDays,
  mapObservationToCurrent,
} from "./mapper";
import { forwardGeocode, reverseGeocode } from "./providers/geocoding";
import {
  fetchLatestObservation,
  fetchNwsActiveAlerts,
  fetchNwsForecast,
  fetchNwsHourlyForecast,
  fetchNwsPoints,
} from "./providers/nws";
import type { GeocodedPlace, WeatherCenterData } from "./types";

export async function geocodeManualLocation(query: string): Promise<GeocodedPlace> {
  return forwardGeocode(query);
}

export async function getWeatherCenterData(lat: number, lon: number): Promise<WeatherCenterData> {
  const partialErrors: WeatherServiceError[] = [];

  let place: GeocodedPlace;
  try {
    place = await reverseGeocode(lat, lon);
  } catch (error) {
    partialErrors.push(
      error instanceof WeatherServiceError
        ? error
        : new WeatherServiceError("geocoding-failed", "Could not resolve county.", error),
    );
    place = {
      lat,
      lon,
      label: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
      county: "Unknown County",
    };
  }

  let points;
  try {
    points = await fetchNwsPoints(lat, lon);
  } catch (error) {
    throw error instanceof WeatherServiceError
      ? error
      : new WeatherServiceError("nws-points-failed", "Could not resolve NWS grid.", error);
  }

  const [forecastResult, hourlyResult, alertsResult, observationResult] = await Promise.allSettled([
    fetchNwsForecast(points.forecast),
    fetchNwsHourlyForecast(points.forecastHourly),
    fetchNwsActiveAlerts(lat, lon),
    fetchLatestObservation(points.observationStations),
  ]);

  if (forecastResult.status === "rejected" && hourlyResult.status === "rejected") {
    throw forecastResult.reason instanceof WeatherServiceError
      ? forecastResult.reason
      : new WeatherServiceError("nws-forecast-failed", "Forecast unavailable.");
  }

  const forecastPeriods =
    forecastResult.status === "fulfilled" ? forecastResult.value : [];
  const hourlyPeriods = hourlyResult.status === "fulfilled" ? hourlyResult.value : [];
  const alerts =
    alertsResult.status === "fulfilled"
      ? mapNwsAlerts(alertsResult.value)
      : (partialErrors.push(
          alertsResult.reason instanceof WeatherServiceError
            ? alertsResult.reason
            : new WeatherServiceError("nws-alerts-failed", "Alerts unavailable."),
        ),
        []);

  const hourlyCurrent = hourlyPeriods[0];
  const observation =
    observationResult.status === "fulfilled" ? observationResult.value : null;

  const current = observation
    ? mapObservationToCurrent(observation, hourlyCurrent)
    : hourlyCurrent
      ? mapHourlyToCurrent(hourlyCurrent)
      : null;

  if (!current) {
    throw new WeatherServiceError("partial-response", "Current conditions unavailable.");
  }

  const forecast =
    forecastPeriods.length > 0
      ? mapNwsForecastDays(forecastPeriods)
      : hourlyPeriods.length > 0
        ? mapNwsForecastDays(hourlyPeriods)
        : [];

  if (forecast.length === 0) {
    throw new WeatherServiceError("nws-forecast-failed", "Forecast unavailable.");
  }

  const nwsCity = points.relativeLocation?.properties?.city;
  const nwsState = points.relativeLocation?.properties?.state;
  const location = mapGeocodedPlaceToLocation({
    ...place,
    label:
      place.label ||
      (nwsCity && nwsState ? `${nwsCity}, ${nwsState}` : `${lat.toFixed(2)}, ${lon.toFixed(2)}`),
  });

  const countyPreparedness = await resolveCountyPreparedness(location.county, location.state);

  return {
    isDemo: false,
    isFallback: false,
    location,
    current,
    alerts,
    forecast,
    countyPreparedness,
    agriculture: DEMO_AGRICULTURE_DATA,
    radar: buildNwsRadarInfo(points.gridId, { lat, lon }),
    coordinates: { lat, lon },
  };
}

export async function buildFallbackWeatherData(): Promise<WeatherCenterData> {
  return {
    ...DEMO_WEATHER_CENTER_DATA,
    isDemo: true,
    isFallback: true,
    alerts: [],
    agriculture: DEMO_AGRICULTURE_DATA,
    location: {
      ...DEMO_WEATHER_CENTER_DATA.location,
    },
    countyPreparedness: await resolveCountyPreparedness("Macon County", "AL"),
    radar: buildNwsRadarInfo("BMX", { lat: 32.424, lon: -85.6916 }),
    coordinates: { lat: 32.424, lon: -85.6916 },
  };
}

export function mergeWeatherWithFallback(live: WeatherCenterData | null): WeatherCenterData {
  if (live) return live;
  return {
    ...DEMO_WEATHER_CENTER_DATA,
    isDemo: true,
    isFallback: true,
    alerts: [],
    agriculture: DEMO_AGRICULTURE_DATA,
    countyPreparedness: buildCountyPreparedness("Macon County", "AL"),
    radar: buildNwsRadarInfo("BMX", { lat: 32.424, lon: -85.6916 }),
    coordinates: { lat: 32.424, lon: -85.6916 },
  };
}
