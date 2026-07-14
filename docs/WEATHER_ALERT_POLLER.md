# Weather Alert Poller

Development-only NWS polling for severe weather Web Push delivery.

## Overview

The poller (`src/lib/weather-notifications/poller.ts`) runs one cycle:

1. Load users with `weather_notification_preferences.enabled = true`
2. Group by coordinate bucket (`bucket:lat:lon`) or county (`county:ST:name`)
3. Fetch active NWS alerts once per group via `fetchNwsActiveAlerts`
4. Map alerts to internal delivery model
5. For each user in the group, evaluate delivery (preferences, active state, dedup, quiet hours)
6. Send, delay (quiet hours), or suppress
7. Process due delayed deliveries from `weather_alert_delayed_deliveries`
8. Record run in `weather_alert_poll_runs`

## Manual trigger (CLI)

```bash
npm run poll:weather-alerts
```

Requires in `.env`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

## Manual trigger (admin UI)

Admins can click **Run development poll cycle** on `/admin/weather/notifications`.

- Requires signed-in admin role
- Rate limited (2 requests / 60s per admin)
- Uses authenticated server function `triggerWeatherAlertPollServerFn`

## Grouping

| Priority | Key format | NWS fetch coordinates |
|---|---|---|
| 1 | `bucket:32.4:-84.0` | Bucket center |
| 2 | `county:GA:macon` | Forward geocode `Macon County, GA` |

Users without county or bucket are skipped for that cycle.

## Deduplication

One `processed_weather_alerts` row per `(user_id, nws_alert_id)`. Duplicate alerts are suppressed.

Delayed alerts also use unique `(user_id, nws_alert_id)` in `weather_alert_delayed_deliveries`.

## Quiet hours

- Non-emergency alerts during quiet hours → `delay` → enqueue with `scheduled_for`
- Emergency severity bypasses quiet hours
- Delayed items never deliver after NWS `expires_at` (marked `expired`)

## No fabricated alerts

The poller only delivers alerts returned by the live NWS API. No test or synthetic NWS IDs are injected.

## Observability

Latest poll run is visible on the admin notifications page:

- Groups polled, alerts fetched
- Sent / delayed / suppressed / failed counts
- Error message if cycle failed
