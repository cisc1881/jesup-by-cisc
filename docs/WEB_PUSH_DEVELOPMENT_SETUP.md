# Web Push Development Setup

Sprint 11 Phase 2 — development-only Web Push for the `bgpagczihcnondqttjnq` Supabase project.

## Prerequisites

- Node.js 20+
- Development `.env` with Supabase URL, publishable key, and **service role key**
- HTTPS or `localhost` for service worker registration
- Signed-in user with opt-in preferences enabled

## Generate VAPID keys

```bash
npm run generate:vapid-keys
```

Copy output into `.env` (never commit real private keys):

| Variable | Where | Notes |
|---|---|---|
| `VITE_VAPID_PUBLIC_KEY` | Browser bundle | Safe to expose |
| `VAPID_PUBLIC_KEY` | Server only | Must match public key above |
| `VAPID_PRIVATE_KEY` | Server only | Never prefix with `VITE_` |
| `VAPID_SUBJECT` | Server only | `mailto:` or `https:` contact URI |

## Apply Phase 2 migration (development only)

```bash
npx supabase link --project-ref bgpagczihcnondqttjnq
npx supabase db push
```

Do **not** apply to production `annwryirualnxsrnupjm`.

## Enable push on a device

1. Start dev server: `npm run dev`
2. Sign in and open `/me/weather-alerts`
3. Tap **Enable notifications** (permission is requested on click only)
4. Confirm VAPID status shows **configured**
5. Verify a row appears in `push_subscriptions` (active, not revoked)

## Test delivery

| Action | Type | Label |
|---|---|---|
| **Local test notification** | Browser `Notification` API | Client-only, no server |
| **Send server push test** | Web Push via VAPID | Development only |

Server push test writes a `processed_weather_alerts` row with `delivery_status = test` and does not impersonate NWS.

## Safari / iOS notes

- Web Push on iOS 16.4+ requires Add to Home Screen (installed PWA)
- Permission must be granted from a user gesture
- Service worker must be registered at site scope `/`

## Production blockers

- No production VAPID keys generated in this sprint
- No production migration applied
- No scheduled poller in production — manual/CLI trigger only in dev
- Rate limits on test send and poll trigger are in-memory (reset on server restart)

## Rollback

1. Disable user preferences (`enabled = false`)
2. Revoke subscriptions (`is_active = false`, `revoked_at` set)
3. Remove VAPID vars from environment
4. Revert Phase 2 migration on dev if needed (drop `weather_alert_delayed_deliveries`, `weather_alert_poll_runs`; remove `expired` enum value only if no rows reference it)
