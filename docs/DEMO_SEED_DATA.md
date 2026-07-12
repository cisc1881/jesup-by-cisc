# Demo Seed Data

**Purpose:** Repeatable Sprint 9 demo content for dev/staging  
**Script:** [SPRINT_9_DEMO_SCRIPT.md](./SPRINT_9_DEMO_SCRIPT.md)  
**Seed file:** [`supabase/seed/sprint9_demo_seed.sql`](../supabase/seed/sprint9_demo_seed.sql)

---

## Prerequisites

1. Apply all migrations through `20260711180000_sprint9_demo_fixes.sql`
2. Run seed SQL in Supabase SQL Editor (or `psql` against dev database)

---

## What the seed ensures

| Asset | Identifier | Notes |
|-------|------------|-------|
| Demo event | `b0cdd829-90ca-4b02-aa7d-03282454a0c5` (BTW Summit) | `published`, registration `open` |
| Native evaluation | Linked to BTW Summit | `is_active`, `use_native_form`, open window |
| Evaluation questions | 4 defaults | Rating, long text, yes/no, consent — skipped if defaults exist |
| Public 2FAS internship | slug `demo-2fas-undergraduate-internship` | `is_open`, `is_2fas`, deadline ≥ 60 days ahead |
| Attendance backfill | BTW Summit registrations | Creates missing `event_attendance` rows |

---

## How to run (Supabase SQL Editor)

**Target:** Dev/staging project `trffktqewlrzziowmspd` only. **Do not run on production.**

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/trffktqewlrzziowmspd)
2. Navigate to **SQL Editor** → **New query**
3. Open local file `supabase/seed/sprint9_demo_seed.sql` and paste the entire contents
4. Click **Run** (or Cmd/Ctrl+Enter)
5. Expect: `Success. No rows returned` (the script uses a `DO $$ … END $$` block)

Re-running is safe: uses `ON CONFLICT` / existence checks; does not delete unrelated rows.

**Compatibility:** Requires BTW Summit event `b0cdd829-90ca-4b02-aa7d-03282454a0c5` to exist (already present in dev). Updates in place; no destructive overwrites.

---

## Demo accounts (dev)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@jesup.test` | `Jesup2026!` |
| Attendee | `normal@jesup.test` | `Jesup2026!` |

---

## Verification after seed

| Check | Expected |
|-------|----------|
| `/internships` (signed out) | Shows **2FAS Undergraduate Internship (Demo)** |
| `/events/b0cdd829-90ca-4b02-aa7d-03282454a0c5/evaluation` | Native evaluation form (when signed in as registered attendee) |
| Admin → BTW Summit → Registrations | At least one registration row |
| Admin → `/admin/internships` | Demo 2FAS row with Open badge |

---

## RLS verification

See [`supabase/verification/sprint9_demo_rls.sql`](../supabase/verification/sprint9_demo_rls.sql) for manual SQL checks after migration apply.
