# Weather Provider Integration — Sprint 10 Phase 2

## Architecture

```
Browser (Home page)
  └─ HomeWeatherSection
       ├─ useWeatherLocation() — geolocation on user action, manual search, localStorage
       └─ useWeatherData() — React Query → fetchWeatherCenterServerFn
            └─ TanStack Start server function (server-fn.ts)
                 └─ service.ts
                      ├─ providers/geocoding.ts — Nominatim + U.S. Census county fallback
                      ├─ providers/nws.ts — NWS grid, forecast, alerts, observations
                      ├─ mapper.ts — normalize to WeatherCenterData
                      ├─ county-directory-service.ts — Supabase verified → built-in → generic
                      ├─ cache-factory.ts — memory / Cloudflare Cache API adapter
                      └─ radar.ts — NWS radar links (no API key)
```

Components consume only `WeatherCenterData` — provider response shapes never leak into UI.

## Providers

### National Weather Service (NWS)

| Endpoint | Purpose |
|----------|---------|
| `GET https://api.weather.gov/points/{lat},{lon}` | Resolve forecast grid |
| `GET {forecast}` | 7-day periods (day/night) |
| `GET {forecastHourly}` | Hourly periods for current/rain chance |
| `GET https://api.weather.gov/alerts/active?point={lat},{lon}` | Active alerts (GeoJSON) |
| `GET {observationStations}` → `/stations/{id}/observations/latest` | Latest observation |

- **API key:** None required
- **User-Agent:** Required — `JESUP-Weather-Center/1.0 (https://jesup.cisc1881.org; contact: info@accessfarmtotable.com)`
- **Usage limits:** Fair-use; avoid burst traffic; cache responses server-side
- **Coverage:** United States only (NWS points lookup fails outside U.S.)
- **Production:** All NWS calls run in TanStack Start server functions (never from the browser)

### Reverse geocoding — OpenStreetMap Nominatim

| Endpoint | Purpose |
|----------|---------|
| `GET https://nominatim.openstreetmap.org/reverse` | City, county, state, ZIP from coordinates |
| `GET https://nominatim.openstreetmap.org/search` | Forward geocode city/ZIP queries |

- **API key:** None
- **User-Agent:** Required (same JESUP header)
- **Usage limits:** Max 1 request/second; cache aggressively (24h for geocoding)
- **Production:** Server-side only; respect [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)

### County fallback — U.S. Census Geocoder

| Endpoint | Purpose |
|----------|---------|
| `GET https://geocoding.geo.census.gov/geocoder/geographies/coordinates` | County name when Nominatim county is missing |

- **API key:** None
- **Coverage:** U.S. coordinates only

## Caching

| Data | Client (React Query) | Server (in-memory) |
|------|---------------------|-------------------|
| Current conditions | 10 min stale | 10 min TTL |
| Alerts | 5 min stale | 5 min TTL |
| Forecast | 30 min stale | 30 min TTL |
| Geocoding | 24 h stale | 24 h TTL |
| NWS points | — | 60 min TTL |

**Notes:**
- Server cache is per-process in-memory (`src/lib/weather/cache.ts`). For production Workers, replace with KV/Durable Object or edge cache.
- Alerts must not be served stale beyond 5 minutes.
- Geocoding results are keyed by rounded coordinates or search string.

## Privacy behavior

- Location permission is **optional** and requested only after user taps **Use my location**.
- Location is **not continuously tracked** — single `getCurrentPosition` per user action.
- Precise coordinates are **not stored in the database**.
- Selected location (label, county, lat/lon) may be stored in **browser localStorage** (`jesup-weather-location`).
- Users can enter a city/ZIP manually or revert to the Macon County default.
- Privacy copy is shown in `WeatherLocationControl`.

## Fallback behavior

| Failure | Behavior |
|---------|----------|
| Geolocation unsupported/denied | Keep selected/default location; show status banner |
| Geocoding failure | Use coordinate label; generic county preparedness |
| NWS points failure | Full demo fallback (`isFallback: true`) |
| Forecast failure (no hourly) | Provider error → fallback |
| Alerts failure | Empty alerts + live conditions if available |
| Observation failure | Use first hourly period for current conditions |
| Complete provider outage | Demo `WeatherCenterData` with `isFallback: true` |
| Offline | React Query error → fallback; home page still renders |

Agricultural insights remain Phase 1 demo content until Phase 3 live feeds.

## County preparedness

- **Macon County, Alabama** → verified EMA contact (`334-724-2626`) and JESUP guidance
- **All other counties** → generic guidance, `contactAvailable: false`, no invented phone numbers, **Change county** action

## Alert severity mapping

NWS `event`, `severity`, and `urgency` map to:

| Output | Rule |
|--------|------|
| `emergency` | `severity: Extreme` or `urgency: Immediate` |
| `warning` | Event contains "Warning" or `severity: Severe` |
| `watch` | Event contains "Watch" or `severity: Moderate` |
| `advisory` | Event contains "Advisory" or default |

Live alerts display **Live NWS data** badge and `source` (sender name).

## Production deployment requirements

1. Ensure Nitro/Worker server functions can reach `api.weather.gov`, `nominatim.openstreetmap.org`, and `geocoding.geo.census.gov`.
2. Set a production contact in `WEATHER_USER_AGENT` (`src/lib/weather/constants.ts`).
3. `CloudflareWeatherCache` uses Cache API with memory fallback — see `docs/WEATHER_CACHE_AND_RATE_LIMITING.md`.
4. Monitor NWS/Nominatim rate limits; server-side buckets + exponential backoff implemented.
5. No secrets required for weather providers.
6. Server functions include geocode/weather rate limits — add edge IP limits in production if needed.

## County directory (Phase 3)

See `docs/COUNTY_EMERGENCY_DIRECTORY.md`.

Resolution order: Supabase verified → built-in Macon County → generic guidance.

## Radar (Phase 3)

Provider-neutral `WeatherRadarCard` links to official NWS office and live radar loop URLs. No private API keys. No static screenshot presented as live imagery.

Future: tile-provider integration (Mapbox/RainViewer) documented but not implemented.

## Known limitations

- U.S.-only NWS coverage
- Nominatim 1 req/sec — manual search min length + server rate limits
- Cloudflare cache depends on `caches.default` availability in Worker runtime
- Agricultural insights still demonstration data
- Push notifications not started
- Heat index/humidity may be missing when observation station data is sparse
- County directory requires migration on dev/prod Supabase before DB-backed lookups work

## Phase 4 (recommended)

- Push notifications for severe alerts (requires service worker + notification preferences)
- Live agricultural advisory feeds (Extension, USDA)
- Additional verified Alabama county records via admin workflow
- Edge IP rate limiting and KV-backed shared cache
- Optional radar tile provider with server-side token proxy
