# Staging Demo Results

**Release:** `v1.0.0-beta.3` (release candidate)  
**Prior tag:** `v1.0.0-beta.2` — superseded; predates post-demo fixes  
**Demo dates:** July 11, 2026 — initial · post-fix re-run (~1:36 PM) · route/note fixes (~2:11 PM) · steps 8–16 re-run (~3:15 PM) · gallery E2E complete (~8:06 PM) · RC finalization (~8:16 PM)  
**Demo script:** [SPRINT_9_DEMO_SCRIPT.md](./SPRINT_9_DEMO_SCRIPT.md)  
**Seed:** [DEMO_SEED_DATA.md](./DEMO_SEED_DATA.md)

---

## Executive summary

| Metric | Value |
|--------|-------|
| **Decision** | **GO WITH CONDITIONS** (gallery E2E complete; ops items pending) |
| **Score (steps 8–16 re-run)** | 13 pass · 0 partial · 0 not run |
| **Score (steps 1–7 + fixes)** | 7 pass · 0 partial · 0 fail |
| **Build** | ✅ Pass (July 11, 2026, beta.3 RC) |
| **RLS verification** | ✅ Pass — `node scripts/sprint9_rls_verify.mjs` (21/21) |
| **FK migration (optional)** | ⏳ Pending SQL Editor apply — no `SUPABASE_DB_URL` in dev env |

**Fixes landed this session:**
- P1 — Child admin routes render via `<Outlet />` pattern
- P2 — Inquiry notes load after save (profiles batch fetch)
- P3 — Homepage resilient loading (section isolation + error boundary)
- P4 — Public inquiry via `submit_public_inquiry` RPC
- P5 — Attendance check-in persistence display
- P6 — Offline banner interaction fix
- P7 — Event evaluation child route `<Outlet />`

**Remaining:** Production backup, production migrations, smoke test, ops sign-off; optional FK migration; RLS verification SQL.

---

## Deployment decision

### **GO WITH CONDITIONS**

All 16 demo steps pass on local dev (July 11, 2026 ~8:06 PM), including gallery E2E (steps 11–13). **Deploy to production only after:**

1. **Production database backup** taken immediately before migration window
2. **All Sprint 9 migrations** applied to production in order (see [PRODUCTION_MIGRATION_PLAN.md](./PRODUCTION_MIGRATION_PLAN.md))
3. **Production smoke test** completed per [PRODUCTION_SMOKE_TEST.md](./PRODUCTION_SMOKE_TEST.md)
4. **Ops sign-off** — admin account verified in `user_roles`, environment variables confirmed, incident contact assigned

**Recommended (not blocking deploy):**
- Optional migration `20260711193000_inquiry_notes_author_profile_fkey.sql` (schema hygiene; client fix works without it)
- RLS verification SQL — `supabase/verification/sprint9_demo_rls.sql`

---

## Environment

| Item | Value |
|------|-------|
| Host | Local dev — `http://localhost:8080/` |
| Supabase project | `trffktqewlrzziowmspd` |
| Demo event | BTW Summit — `b0cdd829-90ca-4b02-aa7d-03282454a0c5` |
| Demo inquiry | `b165d399-4291-465b-9599-9cb746b78b6b` · ref **B165D399** |
| Attendee ticket | **9701B9D800DD** (`normal@jesup.test`) |
| Admin | `admin@jesup.test` / `Jesup2026!` |
| Attendee | `normal@jesup.test` / `Jesup2026!` |

---

## Fix verification (July 11, 2026 ~2:11 PM)

### P1 — Child admin route rendering

**Root cause:** TanStack Router registers attendance, gallery, evaluations, and event reports as **child routes** of `/admin/events` and `/admin/reports`, but parent components rendered only their own UI with no `<Outlet />`. Child route components never mounted.

**Fix:** `useMatches()` + early `return <Outlet />` when a child route is active (same pattern as `programs.tsx`, `news.tsx`).

| URL | Result | Content observed |
|-----|--------|------------------|
| `/admin/events` | ✅ Pass | Events & Workshops list only (no child duplication) |
| `/admin/events/{eventId}/attendance` | ✅ Pass | Event attendance page, summary cards, walk-in button |
| `/admin/events/{eventId}/gallery` | ✅ Pass | Event gallery moderation UI |
| `/admin/reports` | ✅ Pass | Reports landing with metrics |
| `/admin/reports/events` | ✅ Pass | Event report builder with filters |
| `/admin/reports/events/{eventId}` | N/A | Route not defined in route tree |

Direct navigation and browser refresh confirmed on attendance, gallery, and reports/events.

### P2 — Inquiry note persistence

**Root cause:** `listInquiryNotes` used PostgREST embed `profiles ( full_name, email )`, but `inquiry_notes.author_id` references `auth.users(id)` — no FK to `profiles(id)`. Unlike `event_registrations` (which has `event_registrations_user_profile_fkey`), the embed query failed. Inserts succeeded; list refetch failed silently from the UI perspective (success toast on insert, empty note list).

**Fix:**
- `listInquiryNotes` — fetch notes, then batch-fetch profiles by `author_id`
- `submitNote` — refetch after insert; success toast only when note appears in refreshed list
- Migration `20260711193000_inquiry_notes_author_profile_fkey.sql` adds FK for schema consistency

| Check | Result |
|-------|--------|
| Note appears immediately after save | ✅ Pass |
| Note persists after full page reload | ✅ Pass (2 notes visible) |
| Author name shown | ✅ Pass (`admin@jesup.test`) |
| Admin-only | ✅ Unchanged (RLS `inquiry_notes admin all`) |

---

## Post-fix re-demo results (steps 1–7, pre-route-fix)

| # | Step | Session | Result | Notes |
|---|------|---------|--------|-------|
| 1 | Open JESUP | Signed-out | ✅ Pass | Home loads |
| 2 | Browse programs/events | Signed-out | ✅ Pass | MeatMe + BTW Summit detail |
| 3 | Submit public inquiry | Signed-out | ✅ Pass | Reference **B165D399** |
| 4 | Admin notification | Admin | ✅ Pass | Bell + offline banner pass-through |
| 5 | Review/assign inquiry | Admin | ✅ Pass (after P2) | Status, assign, notes all persist |
| 6 | Register for event | Attendee | ✅ Pass | Ticket **9701B9D800DD** |
| 7 | Check in attendee | Admin | ✅ Pass | Via registrations dialog + attendance page |

---

## Steps 8–16 re-run (July 11, 2026 ~3:15 PM)

| # | Step | Session | Result | Notes |
|---|------|---------|--------|-------|
| 8 | Add walk-in | Admin | ✅ Pass | **Demo Walk-In** / `walkin-demo@mailinator.com`; Walk-ins summary = 1 |
| 9 | Complete evaluation | Attendee | ✅ Pass | Native form submitted; **Thank you** / completion state |
| 10 | Demographic aggregates | Admin | ✅ Pass | After attendee saved optional demographics (consent + county **Macon**), attendance page shows **Demographic summaries (aggregate only)** with **Fewer than 5** suppression |
| 11 | Submit participant photo | Attendee | ✅ Pass | `normal@jesup.test` → **Share a photo** → image + caption **Demo summit photo** + alt **Attendees at BTW Summit demo** + permission → **Thank you! Your photo has been submitted…**; visible on `/me` → Photo Submissions as pending |
| 12 | Approve photo | Admin | ✅ Pass | `/admin/events/gallery` → **Review** → **Approve**; status **Reviewed Jul 11, 2026, 8:04 PM**; persists after refresh under **Approved** filter |
| 13 | Public gallery image | Signed-out | ✅ Pass | `/events/b0cdd829-90ca-4b02-aa7d-03282454a0c5` (refreshed) → **Gallery** shows approved image with caption **Demo summit photo**; alt **Attendees at BTW Summit demo** |
| 14 | Generate event report | Admin | ✅ Pass | `/admin/reports/events` → BTW Summit: attendance summary, evaluation findings, demographic section, participant comment |
| 15 | Save draft / finalize / print | Admin | ✅ Pass | Draft **BTW Summit 2026 Impact Report** saved → finalized; `#event-report-print-root` present; 5 `.no-print` controls; JESUP branding in preview; **Print report** invokes `window.print()` |
| 16 | 2FAS open eligibility | Public | ✅ Pass | `/internships` lists **2FAS Undergraduate Internship (Demo)** + legacy 2FAS row; Apply opens institution picker with 1890 land-grant schools (e.g. Tuskegee University) |

**Additional fix verified this session:** `src/routes/events.$id.tsx` — `<Outlet />` for `/events/$id/evaluation` child route (required for step 9).

---

## Demo seed — apply in Supabase SQL Editor

**Do not run on production.** Dev/staging project `trffktqewlrzziowmspd` only.

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → project **trffktqewlrzziowmspd**
2. Go to **SQL Editor** → **New query**
3. Paste the full contents of `supabase/seed/sprint9_demo_seed.sql`
4. Click **Run** (expect “Success. No rows returned” from the `DO $$` block)
5. Verify:
   - `/internships` (signed out) → **2FAS Undergraduate Internship (Demo)**
   - `/events/b0cdd829-90ca-4b02-aa7d-03282454a0c5/evaluation` (as `normal@jesup.test`) → native form
6. Re-run steps 8–16 per [SPRINT_9_DEMO_SCRIPT.md](./SPRINT_9_DEMO_SCRIPT.md)

**Seed review:** Idempotent (`ON CONFLICT` / existence checks); targets fixed BTW Summit UUID; sets `is_open`/`is_2fas` on demo internship; activates native evaluation + default questions; backfills attendance rows; no destructive deletes.

---

## Fixes applied (July 11, 2026)

| Priority | Fix | Files |
|----------|-----|-------|
| P1 | Child route `<Outlet />` rendering | `src/routes/_authenticated/admin/events.lazy.tsx`, `src/routes/_authenticated/admin/reports.tsx` |
| P2 | Inquiry note list + save verification | `src/lib/inquiries.ts`, `src/components/admin/inquiry-detail-drawer.tsx` |
| P2b | `author_id` → `profiles` FK (optional apply) | `supabase/migrations/20260711193000_inquiry_notes_author_profile_fkey.sql` |
| (prior) P1–P5 | Inquiry RPC, check-in, profiles policy, offline banner, seed SQL | See prior migration + seed files |

---

## Verification checklist

| Check | Status |
|-------|--------|
| `npm run build` | ✅ Pass |
| Child admin routes render | ✅ Pass |
| Inquiry note persistence | ✅ Pass |
| Demo seed applied | ✅ Pass (evaluation + 2FAS internship active) |
| Steps 8–16 full pass | ✅ Pass (13/13 runnable steps) |
| Gallery E2E (steps 11–13) | ✅ Pass |
| RLS verification (automated) | ✅ Pass (21/21) |
| Optional FK migration | ⏳ SQL ready; apply via SQL Editor |

---

## Remaining conditions (ordered)

1. **Production database backup** — before migration window
2. **Production migrations** — apply all Sprint 9 migrations per [PRODUCTION_MIGRATION_PLAN.md](./PRODUCTION_MIGRATION_PLAN.md)
3. **Production smoke test** — per [PRODUCTION_SMOKE_TEST.md](./PRODUCTION_SMOKE_TEST.md)
4. **Ops sign-off** — admin account, env vars, incident contact
5. **Apply optional FK migration** — `20260711193000_inquiry_notes_author_profile_fkey.sql` (dev + prod SQL Editor)
6. ~~Execute RLS verification~~ — ✅ Done (`scripts/sprint9_rls_verify.mjs`)

---

## v1.0.0-beta.3 release candidate notes

**Tag:** `v1.0.0-beta.3` — Sprint 9 validated release candidate  
**Supersedes:** `v1.0.0-beta.2` (do not deploy beta.2 to production)

### Fixes since beta.2

| Fix | Files / area |
|-----|----------------|
| Homepage failure isolation | `src/routes/index.tsx`, `src/lib/home/queries.ts` |
| Public inquiry RPC | `src/lib/inquiries.ts`, `20260711180000_sprint9_demo_fixes.sql` |
| Attendance check-in persistence | `src/lib/attendance.ts`, admin events UI |
| Inquiry note persistence | `src/lib/inquiries.ts`, `inquiry-detail-drawer.tsx` |
| Offline banner interaction | `src/components/offline-banner.tsx` |
| Nested admin route rendering | `events.lazy.tsx`, `reports.tsx`, `events.$id.tsx` |
| Gallery E2E validated | Steps 11–13 pass (upload → approve → public) |
| Sprint 9 demo | 13/13 runnable steps pass |

### RLS verification (July 11, 2026 ~8:20 PM)

Executed: `node scripts/sprint9_rls_verify.mjs` against dev project `trffktqewlrzziowmspd`

| Area | Result |
|------|--------|
| Public inquiry (anon RPC, SELECT/UPDATE/DELETE deny) | ✅ Pass |
| Inquiry isolation (normal vs admin) | ✅ Pass |
| Inquiry notes (admin-only, persist, author profile) | ✅ Pass |
| Attendance (own-rows only for normal; admin read) | ✅ Pass |
| Evaluations (cross-user read blocked) | ✅ Pass |
| Demographics (raw protected; aggregates suppressed) | ✅ Pass |
| Gallery (approved-only public query) | ✅ Pass |
| Reports (snapshots admin-only) | ✅ Pass |
| Profiles (own profile readable) | ✅ Pass |

**Summary:** 21 pass · 0 fail

### Optional FK migration status

`20260711193000_inquiry_notes_author_profile_fkey.sql` — **not applied** (no direct Postgres credentials in environment). SQL corrected to drop `inquiry_notes_author_id_fkey` before adding `profiles` FK. Apply manually in Supabase SQL Editor; pre-check orphan `author_id` rows.

---

## Security verification (unchanged)

| Rule | Expected |
|------|----------|
| Anon inquiry insert | ✅ via RPC only |
| Internal notes admin-only | ✅ `inquiry_notes` admin policy |
| No RLS weakening in fixes | ✅ Client-only note query change |

See [sprint9_demo_rls.sql](../supabase/verification/sprint9_demo_rls.sql).
