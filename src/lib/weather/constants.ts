/** Default Macon County / Tuskegee coordinates for fallback weather. */
export const DEFAULT_WEATHER_COORDS = {
  lat: 32.424,
  lon: -85.6916,
} as const;

export const DEFAULT_WEATHER_LABEL = "Tuskegee, AL";
export const DEFAULT_WEATHER_COUNTY = "Macon County";
export const DEFAULT_WEATHER_STATE = "AL";

export const WEATHER_LOCATION_STORAGE_KEY = "jesup-weather-location";

/** Required by api.weather.gov — identify the application and provide contact. */
export const WEATHER_USER_AGENT =
  "JESUP-Weather-Center/1.0 (https://jesup.cisc1881.org; contact: info@accessfarmtotable.com)";

/** NWS API base — no API key required. */
export const NWS_API_BASE = "https://api.weather.gov";

/** OpenStreetMap Nominatim — no API key; respect 1 req/sec and User-Agent policy. */
export const NOMINATIM_API_BASE = "https://nominatim.openstreetmap.org";

/** U.S. Census geocoder — no API key; county fallback for U.S. coordinates. */
export const CENSUS_GEOCODER_BASE = "https://geocoding.geo.census.gov/geocoder";

/** Client React Query stale times (ms). */
export const WEATHER_CURRENT_STALE_MS = 10 * 60_000;
export const WEATHER_ALERTS_STALE_MS = 5 * 60_000;
export const WEATHER_FORECAST_STALE_MS = 30 * 60_000;
export const WEATHER_GEOCODE_STALE_MS = 24 * 60 * 60_000;

/** Server in-memory cache TTLs (ms). */
export const SERVER_CACHE_TTL = {
  current: WEATHER_CURRENT_STALE_MS,
  alerts: WEATHER_ALERTS_STALE_MS,
  forecast: WEATHER_FORECAST_STALE_MS,
  geocode: WEATHER_GEOCODE_STALE_MS,
  points: 60 * 60_000,
  countyDirectory: 12 * 60 * 60_000,
} as const;

/** Client refresh throttle */
export const WEATHER_REFRESH_MIN_INTERVAL_MS = 30_000;
export const GEOCODE_MIN_QUERY_LENGTH = 3;
export const GEOCODE_RATE_LIMIT = { maxRequests: 12, windowMs: 60_000 } as const;
export const WEATHER_FETCH_RATE_LIMIT = { maxRequests: 30, windowMs: 60_000 } as const;
