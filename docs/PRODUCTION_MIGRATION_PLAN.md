# Production Migration Plan — JESUP v1.0.0-beta.3

**Release candidate:** `v1.0.0-beta.3`  
**Date:** July 11, 2026 (updated — production target confirmed)  
**Apply to:** Production Supabase project only (manual ops)  
**Do not auto-apply:** Migrations require backup + ops sign-off

---

## Production environment (confirmed)

| Item | Value |
|------|-------|
| **Development Supabase** | `trffktqewlrzziowmspd` — Lovable / local dev (**do not migrate or deploy against this for production**) |
| **Production Supabase** | `annwryirualnxsrnupjm` |
| **Region** | `us-east-1` |
| **Production URL** | `https://jesup.cisc1881.org` |
| **Production API URL** | `https://annwryirualnxsrnupjm.supabase.co` |

**Important:** Do **not** change `supabase/config.toml` `project_id` (remains dev for Lovable). Production CLI work uses `supabase link --project-ref annwryirualnxsrnupjm`, which stores link metadata under `supabase/.temp/` (gitignored).

---

## Summary

| Category | Count | Notes |
|----------|-------|-------|
| **Required production migrations** | 29 | V1 foundation through Sprint 9 demo fixes |
| **Optional schema hygiene** | 1 | `20260711193000_inquiry_notes_author_profile_fkey.sql` |
| **Development-only (never production)** | 1 | `supabase/seed/sprint9_demo_seed.sql` |

**beta.3 supersedes `v1.0.0-beta.2`** — that tag predates post-demo fixes (homepage resilience, inquiry RPC, check-in, inquiry notes, offline banner, admin `<Outlet />`, gallery validation).

---

## Prerequisites

Before Sprint 9 migrations, confirm **22 foundation migrations** (V1 through news/2FAS) are applied on production:

- Platform architecture, events, programs, publications, markets, partners, **news**, podcasts
- `20260709120000_twofas_foundation.sql`
- `20260708143000_storage_buckets.sql`
- `has_role()` and `tg_set_updated_at()` exist

---

## Full execution order (all required migrations)

Apply **in this exact sequence** via Supabase SQL Editor:

```
 1. 20260708002046_a2d8bf82-0d59-4fa5-904a-5f474e4f3313.sql
 2. 20260708002127_3b1bae91-fcff-4712-a66c-9b8e7a0a6f3d.sql
 3. 20260708002908_9a88d345-9cdd-427d-803b-768a6b835da1.sql
 4. 20260708114742_2447323a-8ed7-44c0-ac54-79f7db8a9e0f.sql
 5. 20260708120000_event_registration_count_rpc.sql
 6. 20260708143000_storage_buckets.sql
 7. 20260708170000_programs_management.sql
 8. 20260708180000_programs_phase2b.sql
 9. 20260708190000_publications_phase2c.sql
10. 20260708200000_fix_has_role_anon_rls.sql
11. 20260708210000_program_categories_seed.sql
12. 20260708220000_program_categories_trim.sql
13. 20260708230000_events_phase3a.sql
14. 20260708231000_event_categories_seed.sql
15. 20260708232000_fix_category_admin_rls.sql
16. 20260708300000_markets_phase3b.sql
17. 20260708310000_platform_architecture.sql
18. 20260709120000_twofas_foundation.sql
19. 20260709143000_notification_center.sql
20. 20260709150000_podcast_module.sql
21. 20260709160000_partners_module.sql
22. 20260709170000_news_module.sql
23. 20260710120000_public_engagement_reporting.sql
24. 20260710120100_notification_type_extensions.sql
25. 20260710120200_inquiry_notification_trigger.sql
26. 20260710130000_demographic_aggregate_reporting.sql
27. 20260710140000_event_gallery_storage_and_cover.sql
28. 20260710150000_event_report_snapshots.sql
29. 20260711180000_sprint9_demo_fixes.sql
```

### Optional (schema hygiene — apply after #29 if approved)

```
30. 20260711193000_inquiry_notes_author_profile_fkey.sql
```

**Not a production migration:** `supabase/seed/sprint9_demo_seed.sql` — development/staging demo content only. **Never run on `annwryirualnxsrnupjm`.**

---

## Pre-migration gates (all required before migration #1)

Do **not** apply any migration until every item below is complete:

| # | Gate | Owner | Status |
|---|------|-------|--------|
| 1 | **Production database backup** taken and timestamp recorded | Ops / DBA | ☐ |
| 2 | **Database password** confirmed (Supabase → Project Settings → Database) | Ops / DBA | ☐ |
| 3 | **Supabase CLI authenticated** (`supabase login`) | Ops | ☐ |
| 4 | **Production project linked** (`supabase link --project-ref annwryirualnxsrnupjm`) | Ops | ☐ |
| 5 | **Migration plan reviewed** (this document, 29 required + optional #30) | Tech lead | ☐ |
| 6 | **Incident contacts filled** in [PRODUCTION_ROLLBACK_PLAN.md](./PRODUCTION_ROLLBACK_PLAN.md) | CISC | ☐ |

### Stop conditions (do not migrate)

- Any gate above is incomplete
- Backup cannot be confirmed
- Linked project ref is not `annwryirualnxsrnupjm`
- Accidentally linked to `trffktqewlrzziowmspd` (development)
- Migration verification fails on any step
- Attempting to run `supabase/seed/sprint9_demo_seed.sql` on production

---

## Supabase CLI — login, link, and verification

Run from the repo root. **Do not modify** `supabase/config.toml` (Lovable dev connection).

```bash
cd /Users/mauriceantoine/Projects/jesup-by-cisc

# 1. Authenticate (opens browser)
npx supabase login

# 2. Link to PRODUCTION only (prompts for database password)
npx supabase link --project-ref annwryirualnxsrnupjm

# 3. Confirm linked project (must show annwryirualnxsrnupjm)
npx supabase projects list

# 4. Dry-run pending migrations (inspect only — do not push until backup confirmed)
npx supabase db push --dry-run
```

**Apply one migration at a time (recommended for first production apply):**

```bash
# Option A — SQL Editor (Supabase Dashboard → annwryirualnxsrnupjm → SQL Editor)
# Paste one file from supabase/migrations/ in order; run verification query; proceed.

# Option B — CLI push (after backup + gates; applies all pending in order)
npx supabase db push
```

**Post-link verification (no secrets printed):**

```bash
# Confirm migration history on production
npx supabase migration list

# RLS verification (requires temporary .env pointing at production publishable key)
# node scripts/sprint9_rls_verify.mjs
```

---

## Database backup instructions

**Before migration #1** on project `annwryirualnxsrnupjm`:

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/annwryirualnxsrnupjm)
2. Go to **Project Settings → Database → Backups**
3. Confirm **Point-in-Time Recovery** status (plan-dependent)
4. If available: note latest automatic backup timestamp
5. For Pro/Team: trigger manual backup or document PITR restore point
6. Record in migration log:
   - Backup timestamp (UTC)
   - Method (automatic / manual / PITR)
   - Operator name
   - Backup ID or snapshot reference (if shown)

**Restoration:** Supabase Dashboard → Database → Backups → Restore (or PITR). See [PRODUCTION_ROLLBACK_PLAN.md](./PRODUCTION_ROLLBACK_PLAN.md). Restoring replaces all data after the backup point.

**Do not delete or overwrite existing backups.**

---

## Sprint 9 + beta.3 fix migrations (detail)

### Migration 23 — `20260710120000_public_engagement_reporting.sql`

| Field | Detail |
|-------|--------|
| **Purpose** | Sprint 9A: inquiries, attendance, evaluations, gallery, demographics, RLS |
| **Dependencies** | `events`, `event_registrations`, `profiles`, `has_role()` |
| **Dev** | ✅ Applied |
| **Production** | ⏳ Pending |
| **Verification** | `SELECT COUNT(*) FROM public.inquiries;` · `SELECT proname FROM pg_proc WHERE proname = 'create_anonymous_evaluation_response';` |
| **Rollback** | Restore from backup only |

### Migration 24 — `20260710120100_notification_type_extensions.sql`

| Field | Detail |
|-------|--------|
| **Purpose** | Enum values `inquiry_received`, `evaluation_submitted` |
| **Dependencies** | `notification_type` enum |
| **Dev** | ✅ Applied |
| **Production** | ⏳ Pending |
| **Verification** | `SELECT unnest(enum_range(NULL::public.notification_type));` |
| **Rollback** | Enum values cannot be removed; restore backup |

### Migration 25 — `20260710120200_inquiry_notification_trigger.sql`

| Field | Detail |
|-------|--------|
| **Purpose** | Admin notification on new inquiry |
| **Dependencies** | #24, `create_admin_notification()` |
| **Dev** | ✅ Applied |
| **Production** | ⏳ Pending |
| **Verification** | `SELECT tgname FROM pg_trigger WHERE tgname = 'notify_inquiry_received';` |
| **Rollback** | `DROP TRIGGER notify_inquiry_received ON public.inquiries;` |

### Migration 26 — `20260710130000_demographic_aggregate_reporting.sql`

| Field | Detail |
|-------|--------|
| **Purpose** | Aggregate RPCs, small-cell suppression |
| **Dependencies** | Migration 23 |
| **Dev** | ✅ Applied |
| **Production** | ⏳ Pending |
| **Verification** | `SELECT proname FROM pg_proc WHERE proname = 'get_event_demographic_aggregates';` |
| **Rollback** | `DROP FUNCTION` aggregate RPCs |

### Migration 27 — `20260710140000_event_gallery_storage_and_cover.sql`

| Field | Detail |
|-------|--------|
| **Purpose** | Gallery cover index, participant storage policies |
| **Dependencies** | `event-images` bucket, `event_gallery` |
| **Dev** | ✅ Applied |
| **Production** | ⏳ Pending |
| **Pre-check** | `SELECT event_id, COUNT(*) FROM public.event_gallery WHERE is_cover GROUP BY event_id HAVING COUNT(*) > 1;` |
| **Verification** | `SELECT policyname FROM pg_policies WHERE policyname LIKE 'event-images participant submission%';` |
| **Rollback** | Drop policies + `set_event_gallery_cover` |

### Migration 28 — `20260710150000_event_report_snapshots.sql`

| Field | Detail |
|-------|--------|
| **Purpose** | Draft/final report snapshots |
| **Dependencies** | Migration 23 |
| **Dev** | ✅ Applied |
| **Production** | ⏳ Pending |
| **Verification** | `SELECT COUNT(*) FROM public.event_report_snapshots;` |
| **Rollback** | `DROP TABLE event_report_snapshots` (loses saved reports) |

### Migration 29 — `20260711180000_sprint9_demo_fixes.sql`

| Field | Detail |
|-------|--------|
| **Purpose** | `submit_public_inquiry` RPC; `profiles admin select`; registration admin update fix |
| **Dependencies** | Migration 23 |
| **Dev** | ✅ Applied |
| **Production** | ⏳ Pending |
| **Verification** | `SELECT proname FROM pg_proc WHERE proname = 'submit_public_inquiry';` · signed-out `/join` submit |
| **Rollback** | `DROP FUNCTION submit_public_inquiry(...);` · drop `profiles admin select` policy |

### Migration 30 (optional) — `20260711193000_inquiry_notes_author_profile_fkey.sql`

| Field | Detail |
|-------|--------|
| **Purpose** | `inquiry_notes.author_id` → `profiles.id` FK (schema hygiene; enables PostgREST embed) |
| **Dependencies** | Migration 23; all `author_id` values must exist in `profiles` |
| **Dev** | ⏳ Pending — requires `SUPABASE_DB_URL` or SQL Editor apply |
| **Production** | ⏳ Pending ops approval |
| **Pre-check** | `SELECT COUNT(*) FROM inquiry_notes n LEFT JOIN profiles p ON p.id=n.author_id WHERE p.id IS NULL;` — must be 0 |
| **Verification** | FK query in `supabase/verification/sprint9_demo_rls.sql`; PostgREST embed `profiles(full_name)` works |
| **Rollback** | `DROP CONSTRAINT inquiry_notes_author_profile_fkey;` re-add `auth.users` FK if needed |
| **Note** | Client already fetches profiles separately; **not required** for app function |

---

## Development-only seed (do not run on production)

| File | Purpose |
|------|---------|
| `supabase/seed/sprint9_demo_seed.sql` | BTW Summit evaluation, 2FAS internship, attendance backfill for demo |

Documented in [DEMO_SEED_DATA.md](./DEMO_SEED_DATA.md).

---

## Post-migration tasks

1. Apply optional FK migration (#30) on dev, then production if approved
2. Regenerate `src/integrations/supabase/types.ts` from production schema
3. Run `node scripts/sprint9_rls_verify.mjs` against target environment
4. Run [PRODUCTION_SMOKE_TEST.md](./PRODUCTION_SMOKE_TEST.md)
5. Confirm admin in `user_roles`

---

## Migration execution log template

| # | Migration | Started (UTC) | Completed | Operator | Dev | Prod | Notes |
|---|-----------|---------------|-----------|----------|-----|------|-------|
| 1–22 | Foundation | | | | ✅ | ☐ | |
| 23 | 20260710120000 | | | | ✅ | ☐ | |
| 24 | 20260710120100 | | | | ✅ | ☐ | |
| 25 | 20260710120200 | | | | ✅ | ☐ | |
| 26 | 20260710130000 | | | | ✅ | ☐ | |
| 27 | 20260710140000 | | | | ✅ | ☐ | |
| 28 | 20260710150000 | | | | ✅ | ☐ | |
| 29 | 20260711180000 | | | | ✅ | ☐ | beta.3 demo fixes |
| 30 | 20260711193000 | | | | ☐ | ☐ | Optional FK |

---

## Rollback checkpoints

| After step | If failure | Action |
|------------|------------|--------|
| Backup | Backup not confirmed | **Stop** — do not migrate |
| Migrations 1–22 | SQL error | **Stop** — fix or restore from backup |
| Migrations 23–29 | Partial apply | **Stop** — assess state; restore if inconsistent |
| Optional #30 | FK orphan rows | **Skip** FK; client works without it |
| Post-migrate | RLS test fails | **Stop deploy** — forward fix or restore |

**Never:** `supabase db reset`, `DROP SCHEMA`, or global trigger disable on production.

---
