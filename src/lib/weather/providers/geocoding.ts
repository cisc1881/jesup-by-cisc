import {
  CENSUS_GEOCODER_BASE,
  NOMINATIM_API_BASE,
  SERVER_CACHE_TTL,
  WEATHER_USER_AGENT,
} from "../constants";
import { getWeatherCache, normalizeCacheKey } from "../cache-factory";
import { WeatherServiceError } from "../errors";
import type { GeocodedPlace } from "../types";

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  state?: string;
  postcode?: string;
};

type NominatimReverseResponse = {
  display_name?: string;
  address?: NominatimAddress;
  lat?: string;
  lon?: string;
};

type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name?: string;
  address?: NominatimAddress;
};

type CensusCounty = {
  NAME?: string;
};

type CensusGeographiesResponse = {
  result?: {
    geographies?: {
      Counties?: CensusCounty[];
    };
  };
};

function roundCoord(value: number): string {
  return value.toFixed(4);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "User-Agent": WEATHER_USER_AGENT,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new WeatherServiceError(
      "geocoding-failed",
      `Geocoding request failed (${response.status})`,
    );
  }

  return (await response.json()) as T;
}

function pickCity(address?: NominatimAddress): string | undefined {
  if (!address) return undefined;
  return address.city ?? address.town ?? address.village ?? address.hamlet;
}

function normalizeCountyName(county?: string): string {
  if (!county) return "Unknown County";
  return county.replace(/\s+County$/i, "").trim() + " County";
}

function buildLabel(city: string | undefined, state: string | undefined, fallback: string): string {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  return fallback;
}

async function reverseGeocodeCensus(lat: number, lon: number): Promise<string | null> {
  const url = new URL(`${CENSUS_GEOCODER_BASE}/geographies/coordinates`);
  url.searchParams.set("x", String(lon));
  url.searchParams.set("y", String(lat));
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("vintage", "Current_Current");
  url.searchParams.set("format", "json");

  try {
    const data = await fetchJson<CensusGeographiesResponse>(url.toString());
    const county = data.result?.geographies?.Counties?.[0]?.NAME;
    return county ? normalizeCountyName(county) : null;
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodedPlace> {
  const cacheKey = normalizeCacheKey(["geo", "reverse", roundCoord(lat), roundCoord(lon)]);
  const cache = getWeatherCache();
  const cached = await cache.get<GeocodedPlace>(cacheKey);
  if (cached) return cached;

  const url = new URL(`${NOMINATIM_API_BASE}/reverse`);
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("addressdetails", "1");

  const data = await fetchJson<NominatimReverseResponse>(url.toString());
  const city = pickCity(data.address);
  const state = data.address?.state;
  let county = normalizeCountyName(data.address?.county);

  if (county === "Unknown County") {
    const censusCounty = await reverseGeocodeCensus(lat, lon);
    if (censusCounty) county = censusCounty;
  }

  const place: GeocodedPlace = {
    lat,
    lon,
    label: buildLabel(city, state, data.display_name ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`),
    county,
    city,
    state,
    postalCode: data.address?.postcode,
  };

  await cache.set(cacheKey, place, { ttlMs: SERVER_CACHE_TTL.geocode });
  return place;
}

export async function forwardGeocode(query: string): Promise<GeocodedPlace> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new WeatherServiceError("geocoding-failed", "Enter a city or ZIP code.");
  }

  const cacheKey = normalizeCacheKey(["geo", "forward", trimmed]);
  const cache = getWeatherCache();
  const cached = await cache.get<GeocodedPlace>(cacheKey);
  if (cached) return cached;

  const url = new URL(`${NOMINATIM_API_BASE}/search`);
  url.searchParams.set("format", "json");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");

  const results = await fetchJson<NominatimSearchResult[]>(url.toString());
  const match = results[0];
  if (!match) {
    throw new WeatherServiceError("geocoding-failed", `No location found for "${trimmed}".`);
  }

  const lat = Number(match.lat);
  const lon = Number(match.lon);
  const city = pickCity(match.address);
  const state = match.address?.state;
  let county = normalizeCountyName(match.address?.county);

  if (county === "Unknown County") {
    const censusCounty = await reverseGeocodeCensus(lat, lon);
    if (censusCounty) county = censusCounty;
  }

  const place: GeocodedPlace = {
    lat,
    lon,
    label: buildLabel(city, state, match.display_name ?? trimmed),
    county,
    city,
    state,
    postalCode: match.address?.postcode,
  };

  await cache.set(cacheKey, place, { ttlMs: SERVER_CACHE_TTL.geocode });
  return place;
}
