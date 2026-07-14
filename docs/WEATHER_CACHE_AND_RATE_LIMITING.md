# Weather Cache and Rate Limiting — Sprint 10 Phase 3

## Cache architecture

```
getWeatherCache() → cache-factory.ts
  ├─ development / fallback: MemoryWeatherCache
  └─ Cloudflare Workers: CloudflareWeatherCache (Cache API + memory fallback)
```

### Adapter interface

`WeatherCacheAdapter` (`cache-types.ts`):

- `get(key)` / `set(key, value, { ttlMs })` / `delete(key)`
- Optional `allowStaleOnError` for forecast/current only — **not alerts**

### TTL targets

| Data | TTL |
|------|-----|
| Alerts | 5 minutes |
| Current / observations | 10 minutes |
| Forecast | 30 minutes |
| Geocoding | 24 hours |
| County directory | 12 hours |
| NWS points | 60 minutes |

### Cache key normalization

`normalizeCacheKey()` lowercases and joins parts with `:` using rounded coordinates or trimmed search strings.

**Never cache:**

- User authentication data
- Precise coordinates as user identity keys tied to accounts
- Expired alerts (hard expiry — no stale-if-error)

## Cloudflare production requirements

1. `CloudflareWeatherCache` uses `caches.default` when available.
2. Memory fallback remains for dev and cache-miss resilience.
3. For multi-region consistency at scale, consider KV namespace binding in Nitro `env`.
4. Do not persist precise browser coordinates in Supabase.

## Rate limiting

Server-side in-memory buckets (`rate-limit.ts`):

| Action | Limit |
|--------|-------|
| Geocode search | 12 requests / minute per normalized query |
| Weather fetch | 30 requests / minute per coordinate bucket |

Behavior:

- Throws user-friendly `WeatherServiceError` when limited
- Transient NWS failures: max 2 attempts with exponential backoff
- No infinite retry loops

## Client refresh control

- **Refresh weather** button in Weather Center
- Minimum 30 seconds between manual refreshes (`WEATHER_REFRESH_MIN_INTERVAL_MS`)
- `placeholderData` preserves previous conditions if refresh fails
- Alerts use shorter React Query stale time (5 min) than forecast (30 min)

## UI debouncing

- Manual location search requires minimum 3 characters
- Submit button disabled until query length met
- Nominatim capped to 1 result server-side

## Privacy

- Rate limits keyed by normalized query/coordinate buckets — not user accounts
- Location preference stored in browser `localStorage` only
- No precise coordinates stored in database

## Future push-notification dependencies

- Alert cache TTL (5 min) aligns with future notification polling cadence
- County directory cache (12 h) separate from alert revalidation
- Push delivery will require verified alert IDs from NWS — not started in Phase 3
