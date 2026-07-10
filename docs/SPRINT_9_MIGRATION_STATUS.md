# Sprint 9 Migration Status

**Last updated:** July 10, 2026  
**Development project:** Verified applied  
**Production:** Not applied unless explicitly confirmed by ops

---

## Sprint 9 migration order (apply in sequence)

| # | File | Phase | Status (dev) | Verification |
|---|------|-------|--------------|--------------|
| 1 | `20260710120000_public_engagement_reporting.sql` | 9A Foundation | ✅ Applied | Inquiries, attendance, evaluations, gallery schema, RLS |
| 2 | `20260710120100_notification_type_extensions.sql` | 9A | ✅ Applied | Extended notification enum types |
| 3 | `20260710120200_inquiry_notification_trigger.sql` | 9B | ✅ Applied | Admin alert on new inquiry |
| 4 | `20260710130000_demographic_aggregate_reporting.sql` | 9F | ✅ Applied | Aggregate RPCs, small-cell suppression |
| 5 | `20260710140000_event_gallery_storage_and_cover.sql` | 9G | ✅ Applied | Participant storage paths, one-cover index, cover RPC |
| 6 | `20260710150000_event_report_snapshots.sql` | 9H | ✅ Applied | Report draft/final snapshot table + admin RLS |

**Total Sprint 9 migrations:** 6  
**Renamed from PROPOSED:** #5 and #6 (filenames only; SQL content unchanged)

---

## What each migration adds

### 9A — `20260710120000_public_engagement_reporting.sql`
- `inquiries`, `inquiry_notes`, assignment workflow
- `event_attendance`, `event_walk_ins`
- `event_evaluations`, questions, responses, answers
- `event_gallery` extensions, `event_gallery_submissions`
- `participant_demographics`
- `institutions` seed data
- Anonymous evaluation RPCs
- Comprehensive RLS for engagement tables

### 9B — Notification extensions + inquiry trigger
- `20260710120100_notification_type_extensions.sql` — inquiry/evaluation notification types
- `20260710120200_inquiry_notification_trigger.sql` — `trg_notify_inquiry_received`

### 9F — `20260710130000_demographic_aggregate_reporting.sql`
- `get_event_demographic_aggregates(p_event_id)`
- `get_multi_event_demographic_aggregates(p_event_ids)`
- `upsert_anonymous_evaluation_demographics(...)`
- Internal `event_demographic_rows()` helper (revoked from PUBLIC)

### 9G — `20260710140000_event_gallery_storage_and_cover.sql`
- Partial unique index: one `is_cover = true` per event
- Participant `event-images` storage policies (`submissions/{user_id}/...`)
- `set_event_gallery_cover()` admin RPC

### 9H — `20260710150000_event_report_snapshots.sql`
- `event_report_snapshots` table
- `event_report_status` enum (`draft`, `final`)
- Admin-only RLS; `created_by = auth.uid()` on insert

---

## Production deployment order

```text
1. 20260710120000_public_engagement_reporting.sql
2. 20260710120100_notification_type_extensions.sql
3. 20260710120200_inquiry_notification_trigger.sql
4. 20260710130000_demographic_aggregate_reporting.sql
5. 20260710140000_event_gallery_storage_and_cover.sql
6. 20260710150000_event_report_snapshots.sql
```

### Pre-flight
- [ ] Backup production database
- [ ] Confirm `has_role()` function exists
- [ ] Confirm `tg_set_updated_at()` trigger function exists
- [ ] Regenerate `src/integrations/supabase/types.ts` after apply

### Post-apply smoke SQL
- [ ] `SELECT * FROM event_attendance LIMIT 1` (admin)
- [ ] `SELECT public.get_event_demographic_aggregates('<event_id>')` (admin)
- [ ] Upload test file to `event-images/submissions/{uid}/...` (authenticated non-admin)
- [ ] Insert draft into `event_report_snapshots` (admin)

---

## Rollback notes

- Migrations are **forward-only**. Rollback requires manual SQL and data loss risk.
- Do not drop `participant_demographics` in production without legal/privacy review.
- Event deletion cascades gallery, attendance, evaluations, and report snapshots referencing `event_id`.

---

## TypeScript types

After production apply, regenerate Supabase types and verify RPC signatures for:
- `get_event_demographic_aggregates`
- `get_multi_event_demographic_aggregates`
- `set_event_gallery_cover`
- `event_report_snapshots` table rows
