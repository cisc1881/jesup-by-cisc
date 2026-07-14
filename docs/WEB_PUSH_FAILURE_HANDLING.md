# Web Push Failure Handling

Sprint 11 Phase 2 delivery failure semantics.

## Per-device outcomes

Each active `push_subscriptions` row is updated independently after `sendWebPushToSubscription`:

| Outcome | `last_success_at` | `failure_count` | `is_active` / `revoked_at` |
|---|---|---|---|
| Success | Set to now | Reset to 0 | Unchanged |
| Transient failure (5xx, 429) | Unchanged | Incremented | Deactivate if count ≥ 5 |
| Permanent failure (404, 410) | Unchanged | Incremented | Deactivate immediately |
| Other 4xx | Unchanged | Incremented | Deactivate if count ≥ 5 |

Threshold constant: `PUSH_FAILURE_THRESHOLD = 5` (`delivery-errors.ts`).

## HTTP status classification

| Code | Class | Immediate deactivate |
|---|---|---|
| 404, 410 | permanent | Yes |
| 429, 5xx | transient | No (unless threshold) |
| Other 4xx | permanent | No (unless threshold) |

## Logging

- Raw `endpoint`, `p256dh`, and `auth` are **never** logged to browser console
- Admin UI shows endpoint **host** only

## Processed alert ledger

User-level delivery records in `processed_weather_alerts`:

- `sent` — at least one device succeeded
- `failed` — all devices failed or no active subscriptions
- `suppressed` — preference/dedup/expiry rule blocked send
- `pending` — queued during quiet hours (dedup lock)
- `test` — development server push test only
- `expired` — delayed delivery missed alert expiry

## Admin actions

- **Deactivate** broken subscription — sets `is_active = false`, `revoked_at = now`
- No manual broadcast or arbitrary message entry

## Re-subscription

When a user re-enables notifications:

- Browser `PushManager.subscribe()` creates or reuses subscription
- Upsert on `endpoint` reactivates row (`is_active = true`, `revoked_at = null`, `failure_count = 0`)

## Retry model

There is no general-purpose job queue. Retries happen on:

1. Next poll cycle (new alerts only; dedup prevents repeats)
2. Delayed queue processing at end of each poll cycle
3. User re-enabling after deactivation

Transient failures do not retry in the same send loop iteration.
