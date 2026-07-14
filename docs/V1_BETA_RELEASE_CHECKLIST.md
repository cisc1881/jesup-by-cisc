# JESUP V1 Beta Release Checklist

**Document status:** Release readiness reference  
**Version:** 1.0-beta  
**Last updated:** July 11, 2026  
**Target audience:** CISC staff, developers, and demo presenters  
**Companion docs:** [Product Spec](./JESUP_PRODUCT_SPEC_V1.md) · [Deployment Guide](./DEPLOYMENT_GUIDE.md) · [Sprint 9 QA Report](./SPRINT_9_QA_REPORT.md) · [Sprint 9 Release Notes](./SPRINT_9_RELEASE_NOTES.md) · [Production Readiness Review](./PRODUCTION_READINESS_REVIEW.md)

---

## Release summary

JESUP V1 Beta is a **client-demo-ready** digital Extension platform: mobile-first public modules, a full JESUP Command Center for CISC staff, Supabase-backed CMS with RLS, universal search, and the 2FAS application review pipeline. The beta is suitable for **controlled demos and internal pilot** — not yet a full public production launch without completing demo content seeding and production infrastructure verification.

**Suggested release name:** JESUP V1.0 Beta 3  
**Release candidate tag:** `v1.0.0-beta.3`  
**Prior tag:** `v1.0.0-beta.2` — superseded (do not deploy to production)  
**Suggested release branch:** `release/v1.0.0-beta.3`

### Production readiness (July 11, 2026)

| Document | Purpose | Status |
|----------|---------|--------|
| [STAGING_DEMO_RESULTS.md](./STAGING_DEMO_RESULTS.md) | Demo script execution record | ✅ Complete — all 16 steps pass (July 11, 2026) |
| [DEMO_SEED_DATA.md](./DEMO_SEED_DATA.md) | Idempotent demo seed SQL | ✅ Applied |
| [PRODUCTION_READINESS_REVIEW.md](./PRODUCTION_READINESS_REVIEW.md) | Go/no-go assessment | **GO WITH CONDITIONS** — deploy `v1.0.0-beta.3` |
| [PRODUCTION_MIGRATION_PLAN.md](./PRODUCTION_MIGRATION_PLAN.md) | Sprint 9 migration order + verification | Ready for ops |
| [PRODUCTION_SMOKE_TEST.md](./PRODUCTION_SMOKE_TEST.md) | Post-deploy smoke test | Ready to run |
| [PRODUCTION_DEPLOYMENT_REPORT.md](./PRODUCTION_DEPLOYMENT_REPORT.md) | Production deploy execution record | **DEPLOYMENT BLOCKED** — ops input required |

**Deployment decision:** **GO WITH CONDITIONS** — use **`v1.0.0-beta.3`** as production candidate. Deploy after backup, 29 migrations, smoke test, ops sign-off.

### v1.0.0-beta.3 release candidate

| Item | Status |
|------|--------|
| Homepage failure isolation | ✅ |
| Public inquiry RPC | ✅ |
| Attendance/check-in correction | ✅ |
| Inquiry note correction | ✅ |
| Offline banner fix | ✅ |
| Admin `<Outlet />` child routes | ✅ |
| Gallery E2E (steps 11–13) | ✅ |
| Sprint 9 demo (13/13) | ✅ |
| RLS verification (`scripts/sprint9_rls_verify.mjs`) | ✅ 21/21 |
| Optional FK migration | ⏳ SQL Editor apply pending |
### Production deployment (July 11, 2026)

| Step | Status |
|------|--------|
| Preflight (`769e921`, clean tree, build) | ✅ |
| Production target confirmed | ✅ `annwryirualnxsrnupjm` / `https://jesup.cisc1881.org` |
| Database backup | ❌ Not taken |
| Migrations applied (0/29) | ❌ Not started |
| Cloudflare deploy | ❌ Not started |
| Smoke test | ❌ Not run |
| **Final decision** | **DEPLOYMENT BLOCKED** |

See [PRODUCTION_DEPLOYMENT_REPORT.md](./PRODUCTION_DEPLOYMENT_REPORT.md).

---

## 1. Completed features

### Platform foundation

| Feature | Status | Notes |
|---------|--------|-------|
| TanStack Start + React 19 + Vite 8 | ✅ | SSR via Nitro → Cloudflare Workers |
| Supabase Auth | ✅ | Email/password at `/auth` |
| Protected routes | ✅ | `/_authenticated` layout + admin role gate |
| JESUP design system | ✅ | `src/components/design-system/` |
| React Query defaults | ✅ | 60s stale time, shared query keys |
| SEO infrastructure | ✅ | `buildPageHead` / `listPageHead` with OG, canonical, JSON-LD |
| Offline banner + query error states | ✅ | Shared UX components |
| Skip link + bottom nav a11y | ✅ | `aria-current`, focus management |

### Public modules

| Module | Route | Status |
|--------|-------|--------|
| Home | `/` | ✅ Hero, featured sections, prefetch |
| Programs | `/programs`, `/programs/$slug` | ✅ Filters, detail, attachments |
| Publications | `/publications`, `/publications/$slug` | ✅ Categories, PDF/media |
| Events | `/events`, `/events/$id` | ✅ Registration, capacity, calendar |
| Farmers Markets | `/markets`, `/markets/$id` | ✅ Map, SNAP/EBT, geolocation |
| Partners | `/partners`, `/partners/$slug` | ✅ Impact stats, profiles |
| News | `/news`, `/news/$slug` | ✅ Rich text, categories |
| Podcasts | `/podcasts`, `/podcasts/$slug` | ✅ Episode player UI |
| Grants | `/grants` | ✅ JESUP-branded metadata |
| Surveys | `/surveys` | ✅ Qualtrics links, JESUP metadata |
| Equipment | `/equipment` | ✅ Checkout requests |
| Internships | `/internships` | ✅ Application flow |
| Donations | `/donate` | ✅ Giving portal |
| Universal Search | `/search` + global dialog | ✅ Unified query cache key |
| Resources | `/resources` | ✅ Static hub |

### JESUP Command Center (`/admin`)

| Module | Route | Status |
|--------|-------|--------|
| Dashboard | `/admin` | ✅ Live metrics, activity feed, quick actions |
| Programs | `/admin/programs` | ✅ Lazy-loaded, confirm delete |
| Events | `/admin/events` | ✅ Lazy-loaded, responsive table, registrations, analytics |
| Markets | `/admin/markets` | ✅ Lazy-loaded, vendor/product management |
| Publications | `/admin/publications` | ✅ Lazy-loaded |
| Partners | `/admin/partners` | ✅ Lazy-loaded |
| News | `/admin/news` | ✅ Rich text CMS |
| Podcasts | `/admin/podcasts` | ✅ Episode management |
| 2FAS Applications | `/admin/2fas/applications` | ✅ Review queue, filters, responsive layout |
| Media Library | `/admin/media` | ✅ Lazy-loaded, upload/delete |
| Grants / Surveys / Equipment / Internships | `/admin/*` | ✅ Inline CRUD |
| Users & Roles | `/admin/users`, `/admin/roles` | ✅ Admin grant/revoke |
| Notifications | `/admin/notifications` | ✅ In-app center |
| Analytics / Reports | `/admin/analytics`, `/admin/reports` | ✅ Basic dashboards |
| Event Reports | `/admin/reports/events` | ✅ Sprint 9H — filters, exports, print, snapshots |
| Inquiries | `/admin/inquiries` | ✅ Sprint 9B — assignment, notes, status |
| Event attendance | `/admin/events/$eventId/attendance` | ✅ Sprint 9D |
| Event evaluations | `/admin/events/$eventId/evaluations` | ✅ Sprint 9E |
| Event gallery | `/admin/events/$eventId/gallery` | ✅ Sprint 9G |
| Gallery moderation | `/admin/events/gallery` | ✅ Sprint 9G |
| Settings | `/admin/settings` | ✅ Platform settings |
| Admin Search | `/admin/search` | ✅ Unified search cache |

### Sprint 9 — Public engagement (Phases 9A–9I)

| Phase | Feature | Status | Key routes / libs |
|-------|---------|--------|-------------------|
| **9A** | Engagement foundation | ✅ | Migrations: inquiries, attendance, evaluations, gallery, demographics |
| **9B** | Public inquiries | ✅ | `/join`, `/admin/inquiries` |
| **9C** | Open institution eligibility | ✅ | Institution picker, 2FAS open filter |
| **9D** | Attendance & walk-ins | ✅ | `/admin/events/$eventId/attendance`, `attendance.ts` |
| **9E** | Native evaluations | ✅ | `/events/$id/evaluation`, `evaluations.ts` |
| **9F** | Demographics & aggregates | ✅ | `demographics.ts`, aggregate RPCs |
| **9G** | Gallery & moderation | ✅ | Gallery admin, `/admin/events/gallery`, photo submit |
| **9H** | Event reporting | ✅ | `/admin/reports/events`, `event-reporting.ts` |
| **9I** | Release readiness | ✅ | Security docs, QA report, demo script |

**Sprint 9 companion docs:**
- [SPRINT_9_RELEASE_NOTES.md](./SPRINT_9_RELEASE_NOTES.md)
- [SPRINT_9_QA_REPORT.md](./SPRINT_9_QA_REPORT.md)
- [SPRINT_9_SECURITY_REVIEW.md](./SPRINT_9_SECURITY_REVIEW.md)
- [SPRINT_9_MIGRATION_STATUS.md](./SPRINT_9_MIGRATION_STATUS.md)
- [SPRINT_9_KNOWN_ISSUES.md](./SPRINT_9_KNOWN_ISSUES.md)
- [SPRINT_9_DEMO_SCRIPT.md](./SPRINT_9_DEMO_SCRIPT.md)

**Explicitly not built in Sprint 9:**
- ❌ QR camera scanner
- ❌ AI-generated report narrative
- ❌ Server-generated PDF infrastructure

### 2FAS pipeline (Phase 4A)

| Layer | Status |
|-------|--------|
| Database schema | ✅ Cohorts, milestones, mentors, documents, extended applications |
| Service layer | ✅ `src/lib/twofas.ts` |
| Admin review UI | ✅ Filters, status workflow, document downloads |
| Student portal (`/me/2fas`) | ❌ Not in V1 beta |

### Post-V1 cleanup sprint (completed)

- ✅ Nested buttons fixed in `event-card.tsx` and `market-card.tsx` (stretched link pattern)
- ✅ Route-level code splitting for heavy admin routes (events, programs, partners, markets, publications, media)
- ✅ `useConfirmDialog` / `useAdminDelete` rolled out across admin delete actions
- ✅ Responsive admin tables for Events and 2FAS Applications
- ✅ Universal search query keys unified (`["universal-search", query.trim()]`)
- ✅ Grants and Surveys page metadata updated to JESUP branding

---

## 2. Remaining demo content needed

Content below should be added **through the Command Center** (no code changes required). Priority reflects the [JESUP Demo Flow](./JESUP_PRODUCT_SPEC_V1.md) and current live-data gaps.

### Critical (demo-blocking)

| Content | Where to add | Why it matters |
|---------|--------------|----------------|
| **2FAS program page** | `/admin/programs` | Demo opens 2FAS — needs published program with slug `2fas`, featured flag, hero image |
| **EEE Academy program** | `/admin/programs` | Second signature program for demo narrative |
| **BTW Summit polish** | `/admin/events` | Exists but verify slug (`btw-summit`), cover image, capacity, registration count |
| **2–3 sample 2FAS applications** | Public apply flow → `/admin/2fas/applications` | Empty review queue weakens Command Center demo |
| **1–2 published publications** | `/admin/publications` | Home publications section is empty without these |
| **Home hero slides** | `/admin/programs`, `/admin/events`, `/admin/markets` | Feature content with cover images on published, active records |

### High (strong demo)

| Content | Where to add | Suggested examples |
|---------|--------------|-------------------|
| **Tuskegee Farmers Market** | `/admin/markets` | Verify featured, SNAP/EBT, vendors, products, gallery photos |
| **Podcast placeholder** | `/admin/podcasts` | 1 featured episode — "JESUP: The Digital Extension Wagon" |
| **Partner placeholders** | `/admin/partners` | 3–5 logos (Tuskegee Extension, local orgs, USDA partner) |
| **News article** | `/admin/news` | 1 announcement — BTW Summit or 2FAS cohort opening |
| **Grant listing** | `/admin/grants` | 1–2 realistic community grant opportunities |
| **Survey link** | `/admin/surveys` | 1 Qualtrics community feedback survey |

### Medium (polish)

| Content | Notes |
|---------|-------|
| Program category images | Ensure categories have icons/images for filter pills |
| Event gallery photos | BTW Summit gallery for detail page richness |
| Market map pin accuracy | Verify lat/lng for Tuskegee market |
| Notification seed entries | 1–2 unread notifications for Command Center bell demo |

### Demo search terms to verify

After seeding, confirm universal search returns results for: **2FAS**, **BTW**, **farmers**, **sustainability**.

---

## 3. Supabase migration status

### Migration inventory (28 files + Sprint 9)

Apply **in chronological order** via Supabase SQL Editor or `supabase db push` (if CLI linked).

| # | Migration file | Domain |
|---|----------------|--------|
| 1–22 | *(see prior inventory)* | V1 foundation modules |
| 23 | `20260710120000_public_engagement_reporting.sql` | Sprint 9A foundation |
| 24 | `20260710120100_notification_type_extensions.sql` | Sprint 9 notifications |
| 25 | `20260710120200_inquiry_notification_trigger.sql` | Sprint 9B inquiries |
| 26 | `20260710130000_demographic_aggregate_reporting.sql` | Sprint 9F demographics |
| 27 | `20260710140000_event_gallery_storage_and_cover.sql` | Sprint 9G gallery |
| 28 | `20260710150000_event_report_snapshots.sql` | Sprint 9H reporting |

Full Sprint 9 details: [SPRINT_9_MIGRATION_STATUS.md](./SPRINT_9_MIGRATION_STATUS.md)

### Environment status

| Environment | Expected state | Verification |
|-------------|----------------|--------------|
| **Development** | All 28 migrations applied | Verified July 10, 2026 |
| **Staging** | `v1.0.0-beta.3` RC | Demo + RLS verified — see [STAGING_DEMO_RESULTS.md](./STAGING_DEMO_RESULTS.md) |
| **Production** | Separate project recommended | Apply 29 migrations (+ optional FK) — see [PRODUCTION_MIGRATION_PLAN.md](./PRODUCTION_MIGRATION_PLAN.md) |
| **TypeScript types** | `src/integrations/supabase/types.ts` | Must match live schema after every migration |

### Pre-deploy migration checklist

- [ ] All 28 migration files applied in order with no errors
- [ ] Sprint 9 RPCs verified: `get_event_demographic_aggregates`, `set_event_gallery_cover`
- [ ] `event_report_snapshots` table exists with admin RLS
- [ ] Participant `event-images` storage path policies active
- [ ] `has_role()` RLS function works for admin users
- [ ] At least one admin user in `user_roles` (`role = 'admin'`)
- [ ] Run smoke test per [PRODUCTION_SMOKE_TEST.md](./PRODUCTION_SMOKE_TEST.md)
- [x] Complete staging demo per [STAGING_DEMO_RESULTS.md](./STAGING_DEMO_RESULTS.md)

---

## 4. Environment variables needed

### Required (all environments)

| Variable | Scope | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | Client + build | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client + build | Anon/publishable key (RLS-protected) |
| `VITE_SUPABASE_PROJECT_ID` | Client + build | Project reference ID |
| `SUPABASE_URL` | SSR / Worker | Same URL for server middleware |
| `SUPABASE_PUBLISHABLE_KEY` | SSR / Worker | Same key for server middleware |

### Recommended (production)

| Variable | Scope | Description |
|----------|-------|-------------|
| `VITE_SITE_URL` | Client + build | Canonical domain (`https://jesup.cisc1881.org`) for SEO/JSON-LD |

### Optional (server-only)

| Variable | Scope | Description |
|----------|-------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Bypasses RLS — use only for trusted server tasks; **never** prefix with `VITE_` |

### Not required for V1 beta

| Variable | Notes |
|----------|-------|
| `OPENAI_API_KEY` | Phase 3 — Ask JESUP AI |
| `ANTHROPIC_API_KEY` | Phase 3 — content generation |
| Google Maps API key | Markets use embed (no key required) |

### Security rules

- Never commit `.env` to git
- Never prefix secret keys with `VITE_` (they ship to the browser bundle)
- Use separate Supabase projects for development and production
- Publishable key is safe client-side — RLS enforces access

Reference: `.env.example` in project root.

---

## 5. Pre-demo QA checklist

Run this checklist **on the target demo environment** (staging or production) within 24 hours of the presentation.

### Sprint 9 demo flow (required for beta.2)

- [x] **Join inquiry** — Submit at `/join`; appears in `/admin/inquiries`
- [x] **Event registration** — Register on published event
- [x] **Attendance** — Check in + walk-in at `/admin/events/$eventId/attendance`
- [x] **Evaluation** — Complete at `/events/$id/evaluation`
- [x] **Demographics** — Aggregate cards show suppression on admin pages
- [x] **Photo submit** — Attendee submits; admin approves at `/admin/events/gallery`
- [x] **Public gallery** — Approved image visible on event detail page (signed-out)
- [x] **Event report** — Generate, save draft, finalize, print at `/admin/reports/events`

### Demo flow (end-to-end)

- [ ] **Home** — Featured programs, events, publications, market, podcast sections render with real content
- [ ] **Programs** — Open 2FAS and EEE Academy detail pages; images and attachments load
- [ ] **Events** — BTW Summit opens; registration status and capacity display correctly
- [ ] **Markets** — Tuskegee Farmers Market shows location, SNAP/EBT, products
- [ ] **Universal Search** — Returns hits for: 2FAS, BTW, farmers, sustainability
- [ ] **Command Center** — Dashboard metrics match live counts; quick actions open correct forms
- [ ] **2FAS Applications** — Filter by status; open detail dialog; update status; download documents
- [ ] **Notifications** — Bell icon shows unread count; notification links resolve

### Public UX

- [ ] Mobile layout (iPhone/Android) — bottom nav, carousels, filter pills
- [ ] Event/market cards — save/favorite does not trigger navigation
- [ ] Programs/publications/events detail pages — cover images, lazy loading
- [ ] Auth flow — sign in, sign out, protected `/me` route
- [ ] `/unauthorized` — non-admin blocked from `/admin` with `noindex`

### Command Center

- [ ] All sidebar nav links load without console errors
- [ ] Lazy admin routes load: events, programs, partners, markets, publications, media
- [ ] Delete actions show AlertDialog (not browser `confirm()`)
- [ ] Events admin — desktop table + mobile card layout
- [ ] 2FAS admin — desktop table + mobile card layout
- [ ] CSV export works on at least one list page per module
- [ ] Media upload and delete with confirmation

### Performance

- [ ] Home loads without duplicate section-meta fetches (Network tab)
- [ ] React Query respects 60s stale window on navigation
- [ ] `npm run build` passes locally before deploy

### Accessibility (spot check)

- [ ] Skip link focuses `#main-content`
- [ ] Bottom nav `aria-current` on active route
- [ ] Admin icon buttons have `aria-label`
- [ ] News/partner/event images have meaningful `alt` text

### SEO (spot check)

- [ ] `/grants` and `/surveys` page titles use JESUP (not "CISC Connect")
- [ ] Program detail page has Course JSON-LD in view source
- [ ] News article has Article JSON-LD, canonical, og:image

### Security (spot check)

- [ ] Anon cannot insert into `news_articles` or `programs` via REST API
- [ ] Unpublished content returns 404 on public slug routes
- [ ] 2FAS application data not visible to non-admin users

---

## 6. Deployment checklist

### Pre-deploy

- [ ] `npm run build` succeeds with zero errors
- [ ] `.env` / Worker secrets set for target environment (see Section 4)
- [ ] All Supabase migrations applied to **production** project (see Section 3)
- [ ] Admin user(s) seeded in `user_roles`
- [ ] Demo content seeded (see Section 2)
- [ ] `VITE_SITE_URL` set to production domain

### Build & deploy

```bash
npm install
npm run build
# Deploy .output/ per DEPLOYMENT_GUIDE.md (Cloudflare Workers + CDN)
```

- [ ] Deploy static assets to CDN
- [ ] Deploy SSR Worker with `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` secrets
- [ ] Verify Worker routes all paths to SSR handler (SPA fallback not needed — TanStack Start handles routing)

### Post-deploy smoke test

- [ ] Run full checklist in [PRODUCTION_SMOKE_TEST.md](./PRODUCTION_SMOKE_TEST.md)
- [ ] Production URL loads Home without blank page or Supabase env error
- [ ] `/auth` login works against production Supabase
- [ ] `/admin` accessible for admin user
- [ ] Public inquiry submission works
- [ ] Attendance check-in works
- [ ] Native evaluation submission works
- [ ] Participant photo upload works (storage policy)
- [ ] Event report snapshot save works
- [ ] At least one image loads from Supabase Storage
- [ ] Universal search returns results
- [ ] No mixed-content warnings (all assets HTTPS)

### Rollback plan

- [ ] Previous Worker version tagged and available in Cloudflare dashboard
- [ ] Database backup taken before migration window
- [ ] Incident contacts filled in [PRODUCTION_ROLLBACK_PLAN.md](./PRODUCTION_ROLLBACK_PLAN.md)
- [ ] Database migrations are forward-only — restore-from-backup preferred over manual drops

Full procedures: [PRODUCTION_ROLLBACK_PLAN.md](./PRODUCTION_ROLLBACK_PLAN.md) · [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 7. Suggested git tag / version

| Item | Recommendation |
|------|----------------|
| **Semantic version** | `1.0.0-beta.3` |
| **Git tag** | `v1.0.0-beta.3` |
| **Release title** | JESUP V1.0 Beta 3 — Sprint 9 validated release candidate |
| **Release notes focus** | Post-beta.2 fixes + full demo validation + RLS verification |
| **Previous tag** | `v1.0.0-beta.2` (superseded) |

```bash
git tag -a v1.0.0-beta.3 -m "JESUP v1.0.0-beta.3 - Sprint 9 validated release candidate"
git push origin v1.0.0-beta.3
```

**Do not move or overwrite `v1.0.0-beta.2`.**

---

## 8. Known issues

Issues below are **accepted for V1 beta** unless marked as demo-blocking.

### Demo-blocking (fix before client demo if possible)

| Issue | Location | Workaround |
|-------|----------|------------|
| Empty 2FAS review queue | Live data | Submit 2–3 test applications via public flow |
| Sparse home hero | CMS content | Feature 2FAS + BTW Summit with cover images |
| Missing EEE Academy / 2FAS program pages | `/admin/programs` | Create and publish before demo |

### Medium (acceptable for beta)

| Issue | Location | Notes |
|-------|----------|-------|
| Map list rows: button wrapping anchor | `market-map-view.tsx` | Invalid HTML; map still functional |
| `events.$id` weak 404 semantics | `events.$id.tsx` | Returns null instead of `notFound()` |
| Legacy "CISC Connect" branding | `auth.tsx`, `internships.tsx`, `equipment.tsx` | Grants/surveys already migrated to JESUP |
| Home publications/partners may double-fetch | `lib/home/queries.ts` | Performance only |
| Admin partners/markets tables horizontal scroll on mobile | Admin list pages | Events and 2FAS have responsive cards; others pending |
| Analytics and Reports duplicate queries | `admin/analytics.tsx`, `admin/reports.tsx` | Functional but redundant |
| `DashboardWidgets` exported but unused | `modules/admin` | Dead code, no user impact |

### Low / post-beta

| Issue | Notes |
|-------|-------|
| SSR loader → React Query dehydration | Not all list pages hydrate from loader |
| Admin form dialogs not lazy-loaded | Heavy dialogs load with route chunk |
| Geolocation denial UX on Markets | No inline permission-denied message |
| Event calendar day cells not linkable | Calendar is display-only |
| QR event check-in scanner | Table exists; UI not built — **deferred Sprint 9** |
| AI report narrative | Manual narrative fields only — **deferred Sprint 9** |
| Server-generated PDF | Browser print only — **deferred Sprint 9** |
| Email/push notification delivery | In-app only |
| Public `event-images` bucket | See [SPRINT_9_KNOWN_ISSUES.md](./SPRINT_9_KNOWN_ISSUES.md) |
| Event deletion vs report history | Export/finalize before delete |

Full list: [SPRINT_9_KNOWN_ISSUES.md](./SPRINT_9_KNOWN_ISSUES.md)

---

## 9. Next V1.1 priorities

Ordered by impact for CISC staff and demo → production transition.

### V1.1 — Stabilization & polish

1. **Complete demo content pass** — Seed all Section 2 items; run full demo flow twice
2. **Branding cleanup** — Replace remaining "CISC Connect" metadata on auth, internships, equipment
3. **Responsive admin tables** — Card layouts for partners, markets, publications, news, podcasts
4. **Fix `market-map-view.tsx`** — Resolve nested interactive elements
5. **Production Supabase project** — Separate from dev; verify all migrations + storage CORS
6. **Event 404 semantics** — Use `notFound()` on missing event slugs/IDs
7. **Home query deduplication** — Consolidate publications/partners fetches

### V1.2 — Engagement pipeline

1. **2FAS student portal** — `/me/2fas` milestone progress view
2. **Mentor assignment UI** — Admin assigns mentors from application detail
3. **Email notifications** — Transactional email for registrations and application status
4. **Event QR check-in** — Scanner UI + attendance reporting
5. **Certificate auto-issue** — Post check-in PDF generation

### V1.3 — Intelligence & scale

1. **Ask JESUP AI** — Server-side AI proxy (never client-side API keys)
2. **Analytics v2** — Unified reporting; dedupe analytics/reports routes
3. **Push notifications** — FCM integration for events and 2FAS deadlines
4. **Image CDN transforms** — Supabase image optimization for hero LCP
5. **Native mobile app** — Capacitor or React Native shell (Phase 4 roadmap)

---

## Sign-off

| Role | Name | Date | Approved |
|------|------|------|----------|
| Product / CISC Director | | | ☐ |
| Technical lead | | | ☐ |
| Demo presenter | | | ☐ |

---

*This checklist reflects the codebase as of July 11, 2026. Release candidate: **`v1.0.0-beta.3`**. See [PRODUCTION_READINESS_REVIEW.md](./PRODUCTION_READINESS_REVIEW.md).*
