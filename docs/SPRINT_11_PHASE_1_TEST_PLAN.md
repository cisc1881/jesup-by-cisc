# Sprint 11 Phase 1 Test Plan

Development project: `bgpagczihcnondqttjnq`  
**Do not apply migration or test push delivery against production `annwryirualnxsrnupjm`.**

## Prerequisites

1. Link development Supabase:
   ```bash
   cd /Users/mauriceantoine/Projects/jesup-by-cisc
   npx supabase link --project-ref bgpagczihcnondqttjnq
   npx supabase db push
   ```
2. Regenerate types if needed after migration
3. `npm install`
4. `npm run dev` for manual route checks

## Automated tests

```bash
npm test
npm run build
```

### Unit tests (`src/lib/weather-notifications/weather-notifications.test.ts`)

| Test | Expected |
|---|---|
| Advisory allowed when `alerts_enabled` | pass |
| Watch suppressed when `watches_enabled` false | pass |
| Emergency bypasses quiet hours | pass |
| Expired alert rejected | pass |
| Duplicate NWS alert rejected | pass |
| Coordinate bucketing to 0.1° | pass |
| Signed-out status | pass |
| Unsupported browser status | pass |
| Permission denied status | pass |
| Subscribed / not-subscribed status | pass |

## Route verification

| Route | Signed out | Signed in |
|---|---|---|
| `/` | Weather Center loads; CTA shows "Sign in required" | CTA reflects subscription status |
| `/me/weather-alerts` | Redirect/guard to auth or sign-in prompt | Settings page loads |
| `/auth?next=/me/weather-alerts` | Auth form; returns to settings after login | N/A |
| `/admin/weather/notifications` | No admin access | Admin summary loads |
| `/admin/weather/counties` | No admin access | Sprint 10 counties admin still works |

## Manual UI tests

### Weather Center CTA

- [ ] CTA visible on Home weather section
- [ ] Does **not** request permission on page load
- [ ] Signed-out → links to `/auth` with `next=/me/weather-alerts`
- [ ] Signed-in not subscribed → links to `/me/weather-alerts`

### `/me/weather-alerts`

- [ ] Master enable toggle saves
- [ ] Severity toggles: advisory, watch, warning, emergency
- [ ] Daily forecast toggle present
- [ ] Location sync from Home weather localStorage
- [ ] Quiet hours toggle + start/end
- [ ] Timezone displayed
- [ ] Enable notifications requests permission on click only
- [ ] Disable notifications deactivates subscriptions
- [ ] Send test notification works after permission granted (dev label)
- [ ] Permission denied shows clear message
- [ ] Unsupported browser shows clear message
- [ ] Privacy copy visible

### `/admin/weather/notifications`

- [ ] Summary counts render
- [ ] Failed subscriptions table (no p256dh/auth)
- [ ] Deactivate button works for active failed subs
- [ ] Recent processed alerts table
- [ ] No manual broadcast button
- [ ] Nav item under Community → Weather Notifications

## Service worker

- [ ] `public/sw.js` served at `/sw.js`
- [ ] Registration after Enable notifications click
- [ ] No offline cache changes
- [ ] Dev test notification displays via SW or Notification API

## Security checks

- [ ] Anon cannot read `weather_notification_preferences` (Supabase SQL or API)
- [ ] User A cannot read User B subscriptions
- [ ] Admin can view counts but not raw keys in UI
- [ ] No subscription endpoint in browser console logs

## Regression (Sprint 9 & 10)

- [ ] Home weather loads live/fallback data
- [ ] County emergency directory on weather center
- [ ] `/admin/weather/counties` CRUD still works
- [ ] Geocoding and NWS fetch unchanged

## Production blockers (do not test on prod)

- Real VAPID push delivery
- NWS scheduled poller
- SMS
- Manual admin broadcast

## Sprint 11 Phase 2 recommendations

1. Cloudflare scheduled worker: NWS poll → map → dedupe → push
2. VAPID key generation and Worker Web Push sender
3. `processed_weather_alerts` write path from worker (service role)
4. Quiet-hours delay queue (store delayed alerts, send after window)
5. Daily forecast notification channel (separate from severe alerts)
6. Staging end-to-end test with real push on development project only
7. Production migration review and privacy policy update
