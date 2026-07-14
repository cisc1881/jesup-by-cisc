# Sprint 11 Phase 2 Test Plan

Development Web Push delivery, VAPID, NWS polling, and failure handling.

## Automated tests

```bash
npm test
npm run build
```

Coverage includes:

- VAPID base64 conversion
- Subscription normalization
- 404/410 immediate deactivation
- Transient vs permanent error classification
- Failure threshold (5)
- Location grouping (bucket and county)
- Safe notification URLs
- Payload size bounds
- Missing VAPID configuration error
- Quiet-hours scheduling
- Delayed alert expiry
- User-level deduplication
- Push CTA status (configuration-missing, subscription-failed)

## Manual — VAPID setup

- [ ] Run `npm run generate:vapid-keys`
- [ ] Add keys to `.env` (public + private + subject)
- [ ] Restart dev server
- [ ] `/me/weather-alerts` shows VAPID **configured**

## Manual — subscription flow

- [ ] Sign in, open `/me/weather-alerts`
- [ ] Permission not requested until **Enable notifications** clicked
- [ ] After enable: `push_subscriptions` row with active status
- [ ] Disable: browser unsubscribes, row revoked
- [ ] Re-enable: row reactivated

## Manual — server push test

- [ ] **Send server push test (development only)** delivers notification
- [ ] `processed_weather_alerts` has `delivery_status = test`
- [ ] Payload title indicates development test

## Manual — local test (unchanged)

- [ ] **Local test notification** uses Notification API only
- [ ] Clearly separate from server push test

## Manual — poll cycle

- [ ] `npm run poll:weather-alerts` completes without error
- [ ] `weather_alert_poll_runs` has new row
- [ ] Admin page shows latest poll metrics
- [ ] No fabricated NWS alerts

## Manual — quiet hours

- [ ] Enable quiet hours, set window including current time
- [ ] Run poll during active NWS alerts (non-emergency)
- [ ] Row in `weather_alert_delayed_deliveries` with `pending`
- [ ] Emergency alerts bypass queue

## Manual — admin observability

- [ ] `/admin/weather/notifications` shows enabled users, devices, deliveries
- [ ] Deactivate broken subscription works
- [ ] Run development poll cycle works (admin only)
- [ ] No p256dh/auth/VAPID private key visible

## Manual — security

- [ ] Anonymous users cannot create subscriptions
- [ ] Users cannot read other users' subscriptions
- [ ] Poll trigger rejected for non-admin

## Out of scope (Phase 2)

- Production deploy
- SMS
- Manual admin broadcast
- AI-generated alerts
- Continuous browser polling
