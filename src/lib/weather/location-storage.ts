import {
  DEFAULT_WEATHER_COORDS,
  DEFAULT_WEATHER_COUNTY,
  DEFAULT_WEATHER_LABEL,
  DEFAULT_WEATHER_STATE,
  WEATHER_LOCATION_STORAGE_KEY,
} from "./constants";
import type { LocationSource, StoredWeatherLocation } from "./types";

export function createDefaultStoredLocation(): StoredWeatherLocation {
  return {
    lat: DEFAULT_WEATHER_COORDS.lat,
    lon: DEFAULT_WEATHER_COORDS.lon,
    source: "default",
    label: DEFAULT_WEATHER_LABEL,
    county: DEFAULT_WEATHER_COUNTY,
    state: DEFAULT_WEATHER_STATE,
  };
}

export function readStoredWeatherLocation(): StoredWeatherLocation | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(WEATHER_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredWeatherLocation;
    if (
      typeof parsed.lat !== "number" ||
      typeof parsed.lon !== "number" ||
      !parsed.source
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredWeatherLocation(location: StoredWeatherLocation): void {
  if (typeof window === "undefined") return;
  const { lat, lon, source, label, county, city, state, postalCode } = location;
  window.localStorage.setItem(
    WEATHER_LOCATION_STORAGE_KEY,
    JSON.stringify({ lat, lon, source, label, county, city, state, postalCode }),
  );
}

export function clearStoredWeatherLocation(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(WEATHER_LOCATION_STORAGE_KEY);
}
