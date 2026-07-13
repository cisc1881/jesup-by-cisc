# Push Notification Security

Security requirements and implementation notes for JESUP severe-weather push notifications (Sprint 11 Phase 1).

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
- INSERT: own `user_id` only (future worker will use service role)

**Anonymous role:** no table grants.

## Client-side rules

| Rule | Implementation |
|---|---|
| No automatic permission request | `Notification.requestPermission()` only in `enableNotifications()` click handler |
| No endpoint logging | Subscription endpoints not logged to `console` |
| No key material in admin UI | Admin shows endpoint **host** only, not full URL or p256dh/auth |
| No VAPID private key in client | Only optional `VITE_VAPID_PUBLIC_KEY` for future subscribe |
| No service-role key in client | Supabase anon/authenticated client only |

## Service worker

- `public/sw.js` contains **no API keys**
- Push payload is display-only (title, body, url)
- Future server push signs payloads with private key in Worker — not in SW

## Subscription storage

Push subscription keys (`p256dh`, `auth`) are stored in Supabase encrypted at rest by platform defaults. They are:

- Writable only by the owning authenticated user
- Readable by admin for operational support but **not rendered** in the admin UI
- Revoked via `is_active = false` and `revoked_at` on disable or repeated failures

## Admin capabilities (Phase 1)

- View aggregate counts
- View masked subscription metadata
- Deactivate broken subscriptions
- View processed alert ledger (no PII beyond user UUID in DB; UI shows event metadata only)

**Not available:** manual broadcast, viewing raw subscription keys, editing user preferences.

## Development test mode

- Uses browser Notification API locally
- Does not impersonate NWS alerts
- Does not bypass RLS
- Does not require VAPID

## Threat considerations

| Threat | Mitigation |
|---|---|
| Unauthorized subscription access | RLS + no anon grants |
| Location tracking | Coarse buckets only |
| Permission fatigue / dark patterns | Explicit enable button only |
| Duplicate alert spam | DB unique constraint + delivery evaluator |
| Leaked VAPID private key | Not deployed in Phase 1; store in Worker secrets in Phase 2 |
| XSS stealing push keys | Standard CSP + React escaping; keys useless without VAPID private key |

## Production checklist (before Phase 2 go-live)

- [ ] Security review of scheduled worker
- [ ] VAPID key rotation procedure
- [ ] Rate limits on push fan-out
- [ ] Audit logging for admin deactivations
- [ ] Privacy policy update for push notifications
- [ ] Confirm production Supabase project separate from development
