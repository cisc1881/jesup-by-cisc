# Push Notification Security

Security requirements for JESUP severe-weather Web Push (Sprint 11 Phase 1–2).

## Principles

1. **Opt-in only** — `enabled` defaults to `false`; no automatic permission prompts
2. **Least privilege** — RLS restricts users to their own rows
3. **No secrets in the browser** — VAPID private keys and service-role keys stay server-side
4. **Coarse location only** — latitude/longitude stored as 0.1° buckets; county/state for targeting
5. **Deduplication** — prevents alert spam per user per NWS alert ID

## Row Level Security

### `weather_notification_preferences`

- SELECT: `auth.uid() = user_id` OR admin
- INSERT/UPDATE/DELETE: own `user_id` only

### `push_subscriptions`

- SELECT: own rows OR admin
- INSERT: own `user_id` only
- UPDATE: own rows OR admin (deactivate broken subscriptions)
- DELETE: own rows only

### `processed_weather_alerts`

- SELECT: own rows OR admin
- INSERT: service role (poll worker) or own user (client ledger in Phase 1)

### `weather_alert_delayed_deliveries`

- SELECT: own rows OR admin
- INSERT/UPDATE: own rows OR admin

### `weather_alert_poll_runs`

- SELECT: admin only
- INSERT/UPDATE: service role (poll worker)

**Anonymous role:** no table grants on notification tables.

## Client-side rules

| Rule | Implementation |
|---|---|
| No automatic permission request | `Notification.requestPermission()` only in `enableNotifications()` click handler |
| No endpoint logging | Subscription endpoints not logged to `console` |
| No key material in admin UI | Admin shows endpoint **host** only, not full URL or p256dh/auth |
| VAPID private key server-only | `VAPID_PRIVATE_KEY` never prefixed with `VITE_` |
| Public key in browser only | `VITE_VAPID_PUBLIC_KEY` for `PushManager.subscribe()` |
| No service-role key in client | Supabase authenticated client only; poll uses server functions / CLI |

## Service worker

- `public/sw.js` contains **no API keys**
- Push payload is display-only (title, body, url)
- Server signs payloads with VAPID private key in Node server functions — not in SW

## Subscription storage

Push subscription keys (`p256dh`, `auth`) are stored in Supabase. They are:

- Writable only by the owning authenticated user (upsert on endpoint)
- Readable by admin for operational support but **not rendered** in the admin UI
- Revoked via `is_active = false` and `revoked_at` on disable, 404/410, or failure threshold

## Server-side delivery (Phase 2)

- `sendServerPushTestServerFn` and `triggerWeatherAlertPollServerFn` require Bearer auth
- Poll trigger requires admin role
- Development-only guard rejects production `NODE_ENV`
- Rate limits: test send (3/min), poll trigger (2/min) per user
- Payload URLs validated to same-origin relative paths only
- Title/body sanitized and size-bounded

## Admin capabilities

- View aggregate counts, devices, delayed queue, poll runs
- Deactivate broken subscriptions
- Run development poll cycle (no arbitrary message entry)
- View processed alert ledger

**Not available:** manual broadcast, viewing raw subscription keys, editing user preferences.

## Development test modes

| Mode | API | Record |
|---|---|---|
| Local test | Browser `Notification` | None |
| Server push test | Web Push + VAPID | `processed_weather_alerts.delivery_status = test` |

Neither impersonates live NWS alerts.

## Threat considerations

| Threat | Mitigation |
|---|---|
| Unauthorized subscription access | RLS + no anon grants |
| Anonymous push registration | Server functions require auth |
| Location tracking | Coarse buckets only |
| Permission fatigue | Explicit enable button only |
| Duplicate alert spam | DB unique constraints + delivery evaluator |
| Leaked VAPID private key | Dev keys only; rotate before production |
| XSS stealing push keys | CSP + React escaping; keys useless without VAPID private key |
| Open redirect in notification click | `validateNotificationUrl()` allows `/` paths only |

## Production checklist (before go-live)

- [ ] Generate **separate** production VAPID keys
- [ ] Store private key in deployment secrets (not `.env` in repo)
- [ ] Apply migrations to production project deliberately
- [ ] Scheduled poller with edge rate limits and monitoring
- [ ] VAPID key rotation procedure
- [ ] Audit logging for admin deactivations and poll runs
- [ ] Privacy policy update for push notifications
- [ ] Confirm production Supabase project separate from development (`annwryirualnxsrnupjm`)
