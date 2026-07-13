# Weather Notification Architecture

Sprint 11 Phase 1 establishes the data model, user preferences UI, service worker foundation, and alert deduplication logic for severe-weather push notifications. **Delivery remains in development/test mode** — no live NWS polling worker or production VAPID keys yet.

## Scope

| In scope (Phase 1) | Out of scope |
|---|---|
| Opt-in preferences & device subscriptions | Real server push delivery |
| Service worker push/click handlers | SMS |
| Deduplication ledger | AI features |
| Quiet hours & severity matching | Fabricated emergency alerts |
| Admin visibility (read + deactivate) | Manual broadcast |
| Local development test notifications | Production migration |

## Opt-in flow

1. User visits **Weather & Emergency Center** on Home or opens **`/me/weather-alerts`**.
2. CTA shows current status: signed-out, not subscribed, subscribed, permission denied, or unsupported.
3. Signed-out users are routed to **`/auth?next=/me/weather-alerts`**.
4. Signed-in users configure preferences and tap **Enable notifications**.
5. Browser permission is requested **only on that explicit click** — never on page load.
6. Preferences are saved to `weather_notification_preferences`.
7. If `VITE_VAPID_PUBLIC_KEY` is configured (future), the service worker registers a push subscription stored in `push_subscriptions`.
8. Without VAPID, preferences are saved and **development test mode** allows local notifications via the Notification API.

## Data model

### `weather_notification_preferences`

Per-user opt-in settings: master enable, severity toggles (advisory via `alerts_enabled`, watch, warning, emergency), daily forecast flag, coarse location (`county_name`, `state_code`, `latitude_bucket`, `longitude_bucket`), quiet hours, timezone.

**No precise coordinates** are persisted — buckets round to 0.1°.

### `push_subscriptions`

Browser push endpoints per device. Unique on `endpoint`. Tracks `is_active`, `failure_count`, `revoked_at`.

### `processed_weather_alerts`

Deduplication ledger with `UNIQUE (user_id, nws_alert_id)`. Prevents sending the same NWS alert twice to the same user.

## Service worker

- File: `public/sw.js`
- Registration: `src/lib/weather-notifications/service-worker.ts` → `/sw.js`
- Handles: `install`, `activate`, `push`, `notificationclick`
- **No offline caching** in Phase 1
- **No secrets** in the service worker
- `notificationclick` focuses an existing window or opens the app URL from payload data

## Alert deduplication

Pure functions in `src/lib/weather-notifications/alert-deduplication.ts`:

1. User `enabled` must be true
2. Alert must be active (effective ≤ now < expires)
3. Alert must not already exist in `processed_weather_alerts` for user
4. Severity must match user preferences
5. Quiet hours may **delay** non-emergency alerts
6. **Emergency alerts bypass quiet hours**

## Quiet hours

Evaluated in the user's configured `timezone` using `quiet_hours_start` / `quiet_hours_end`. Overnight windows (e.g. 22:00–07:00) are supported.

## Development test mode

- **Send test notification** uses `Notification` API or service worker `showNotification`
- Clearly labeled "Development test"
- Does **not** call NWS
- Does **not** write `processed_weather_alerts` unless explicitly marked `delivery_status: 'test'` in a future explicit test path

## RLS summary

| Table | User access | Admin access |
|---|---|---|
| `weather_notification_preferences` | CRUD own row | SELECT |
| `push_subscriptions` | CRUD own rows | SELECT, UPDATE (deactivate) |
| `processed_weather_alerts` | SELECT/INSERT own | SELECT |

Anonymous (`anon`) has **no** grants on these tables.

## Routes

| Route | Purpose |
|---|---|
| `/me/weather-alerts` | User settings |
| `/admin/weather/notifications` | Admin summary |
| Weather Center CTA | Status + deep link |

## Future: VAPID setup (Phase 2)

1. Generate VAPID key pair in secure environment
2. Set `VITE_VAPID_PUBLIC_KEY` in development only
3. Store private key in Cloudflare Worker secrets — **never** in client or service worker
4. Worker uses Web Push to deliver to stored `push_subscriptions`

## Future: Cloudflare scheduled worker (Phase 2)

1. Poll NWS alerts for subscribed coarse buckets / counties
2. Map alerts to users via preferences
3. Run deduplication + quiet hours server-side
4. Push via VAPID to active subscriptions
5. Record `processed_weather_alerts` with `delivery_status: 'sent'`

## Production blockers

- Migration **must not** be applied to production `annwryirualnxsrnupjm` until Phase 2 review
- VAPID keys not configured
- No scheduled alert poller
- No rate limiting on push fan-out
- Legal/comms review for emergency notifications

## Rollback

1. Revert application deploy (routes, SW, UI)
2. Tables are additive — optional `DROP TABLE` migration if data must be removed
3. Users can disable via `/me/weather-alerts` without DB rollback
