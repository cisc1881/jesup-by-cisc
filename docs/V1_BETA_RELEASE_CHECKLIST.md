# JESUP V1 Beta Release Checklist

**Document status:** Release readiness reference  
**Version:** 1.0-beta  
**Last updated:** July 9, 2026  
**Target audience:** CISC staff, developers, and demo presenters  
**Companion docs:** [Product Spec](./JESUP_PRODUCT_SPEC_V1.md) · [Deployment Guide](./DEPLOYMENT_GUIDE.md) · [QA Report](./VERSION_1_QA_REPORT.md)

---

## Release summary

JESUP V1 Beta is a **client-demo-ready** digital Extension platform: mobile-first public modules, a full JESUP Command Center for CISC staff, Supabase-backed CMS with RLS, universal search, and the 2FAS application review pipeline. The beta is suitable for **controlled demos and internal pilot** — not yet a full public production launch without completing demo content seeding and production infrastructure verification.

**Suggested release name:** JESUP V1.0 Beta  
**Suggested git tag:** `v1.0.0-beta.1`  
**Suggested release branch:** `release/v1.0.0-beta.1`

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
| Settings | `/admin/settings` | ✅ Platform settings |
| Admin Search | `/admin/search` | ✅ Unified search cache |

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

### Migration inventory (22 files)

Apply **in chronological order** via Supabase SQL Editor or `supabase db push` (if CLI linked).

| # | Migration file | Domain |
|---|----------------|--------|
| 1 | `20260708002046_a2d8bf82-*.sql` | Initial schema |
| 2 | `20260708002127_3b1bae91-*.sql` | Initial schema (continued) |
| 3 | `20260708002908_9a88d345-*.sql` | Initial schema (continued) |
| 4 | `20260708114742_2447323a-*.sql` | Early platform tables |
| 5 | `20260708120000_event_registration_count_rpc.sql` | Event registration RPC |
| 6 | `20260708143000_storage_buckets.sql` | Core storage buckets |
| 7 | `20260708170000_programs_management.sql` | Programs CMS |
| 8 | `20260708180000_programs_phase2b.sql` | Programs Phase 2B |
| 9 | `20260708190000_publications_phase2c.sql` | Publications Phase 2C |
| 10 | `20260708200000_fix_has_role_anon_rls.sql` | RLS security fix |
| 11 | `20260708210000_program_categories_seed.sql` | Program category seeds |
| 12 | `20260708220000_program_categories_trim.sql` | Category cleanup |
| 13 | `20260708230000_events_phase3a.sql` | Events Phase 3A |
| 14 | `20260708231000_event_categories_seed.sql` | Event category seeds |
| 15 | `20260708232000_fix_category_admin_rls.sql` | Category admin RLS |
| 16 | `20260708300000_markets_phase3b.sql` | Markets Phase 3B |
| 17 | `20260708310000_platform_architecture.sql` | CMS platform, media, junction tables |
| 18 | `20260709120000_twofas_foundation.sql` | 2FAS schema + `twofas-documents` bucket |
| 19 | `20260709143000_notification_center.sql` | Notifications |
| 20 | `20260709150000_podcast_module.sql` | Podcast episodes |
| 21 | `20260709160000_partners_module.sql` | Partners module |
| 22 | `20260709170000_news_module.sql` | News articles |

### Environment status

| Environment | Expected state | Verification |
|-------------|----------------|--------------|
| **Development** (`trffktqewlrzziowmspd`) | All 22 migrations applied | Re-run spot checks on `events`, `twofas_cohorts`, `news_articles`, `podcast_episodes` |
| **Production** | Separate project recommended | Apply all 22 migrations before beta deploy |
| **TypeScript types** | `src/integrations/supabase/types.ts` | Must match live schema after every migration |

### Pre-deploy migration checklist

- [ ] All 22 migration files applied in order with no errors
- [ ] `has_role()` RLS function works for admin users
- [ ] Storage buckets exist: `news-images`, `partner-logos`, `program-images`, `event-images`, `market-images`, `publication-files`, `podcast-audio`, `twofas-documents`, `resumes`, `media-assets`
- [ ] Event images bucket CORS and upload limits verified in dashboard
- [ ] At least one admin user in `user_roles` (`role = 'admin'`)
- [ ] `get_event_registration_count` RPC returns expected values
- [ ] Run `supabase db lint` (or manual RLS audit) on production project

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
| `VITE_SITE_URL` | Client + build | Canonical domain (e.g. `https://jesup.cisc.edu`) for SEO/JSON-LD |

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

- [ ] Production URL loads Home without blank page or Supabase env error
- [ ] `/auth` login works against production Supabase
- [ ] `/admin` accessible for admin user
- [ ] At least one image loads from Supabase Storage
- [ ] Universal search returns results
- [ ] No mixed-content warnings (all assets HTTPS)

### Rollback plan

- [ ] Previous Worker version tagged and available in Cloudflare dashboard
- [ ] Database migrations are forward-only — document any manual rollback SQL if needed
- [ ] Keep development Supabase project unchanged as fallback demo environment

Full procedures: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 7. Suggested git tag / version

| Item | Recommendation |
|------|----------------|
| **Semantic version** | `1.0.0-beta.1` |
| **Git tag** | `v1.0.0-beta.1` |
| **Release title** | JESUP V1.0 Beta — Digital Extension Wagon |
| **Release notes focus** | Command Center, 2FAS review, CMS modules, mobile-first public experience |
| **Next tag after content seed** | `v1.0.0-beta.2` (content-only) or `v1.0.0-rc.1` (after full QA pass) |

```bash
git tag -a v1.0.0-beta.1 -m "JESUP V1.0 Beta — first client-demo release"
git push origin v1.0.0-beta.1
```

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
| Email/push notification delivery | In-app only; `channel = email` scaffolded |
| Ask JESUP AI | Not built (Phase 3) |
| 2FAS student portal (`/me/2fas`) | Not built (Phase 2) |
| QR event check-in scanner | Table exists; UI not built |

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

*This checklist reflects the codebase and documentation as of July 9, 2026. Update after each beta iteration.*
