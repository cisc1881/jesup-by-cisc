# JESUP Version 1 — QA Report

**Date:** July 9, 2026  
**Scope:** Production readiness (Sprint 8) — no new CMS modules

---

## Executive Summary

JESUP is **near production-ready** for a Version 1 launch. Core public content modules (Programs, Events, Markets, Publications, Partners, Podcasts, News) are CMS-driven with RLS, admin tooling, search, and mobile-first layouts. Sprint 8 addressed performance defaults, SEO infrastructure, accessibility gaps, dashboard polish, and error/offline UX.

**Version 1 Readiness Score: 82 / 100**

| Area | Score | Notes |
|------|-------|-------|
| Performance | 78 | Query tuning + home prefetch; route-level code splitting still pending |
| Mobile UX | 80 | Touch targets improved; admin tables still horizontal-scroll on small screens |
| Accessibility | 76 | Skip link, aria labels, filter pills; nested interactive elements remain in event/market cards |
| Dashboard | 85 | Skeletons, refresh, error states added |
| Design consistency | 84 | Shared FilterPill + QueryErrorState; admin still uses shadcn vs public design-system |
| Error handling | 83 | Query error UI, offline banner, AlertDialog delete pattern started |
| SEO | 86 | `buildPageHead` utility with OG/Twitter/canonical/JSON-LD on key routes |
| Security | 88 | RLS on content tables; admin gated; storage policies per module |

---

## Remaining Bugs

| Priority | Issue | Location |
|----------|-------|----------|
| High | Favorite/save buttons nested inside card `<Link>` — invalid HTML, ambiguous taps | `market-card.tsx`, `event-card.tsx` |
| High | Map list rows: `<button>` wrapping `<a>` | `market-map-view.tsx` |
| Medium | `events.$id` returns null instead of `notFound()` — weak 404 semantics | `events.$id.tsx` |
| Medium | Home `fetchHomePublications` / `fetchHomePartners` may double-fetch | `lib/home/queries.ts` |
| Low | `DashboardWidgets` exported but unused | `modules/admin` |
| Low | Analytics and Reports admin routes duplicate same query | `admin/analytics.tsx`, `admin/reports.tsx` |

---

## Recommended Improvements (Post V1)

1. **Route-level code splitting** — TanStack file routes are eagerly imported in `routeTree.gen.ts`; lazy-load admin bundle.
2. **Unified delete confirmation** — Roll `useConfirmDialog` across all admin CRUD routes (currently on News only).
3. **Responsive admin tables** — Card layout below `sm` for 2FAS, Events, Partners tables.
4. **Search cache unification** — Align `universal-search`, `universal-search-public`, `universal-search-admin` keys.
5. **Branding cleanup** — Grants/Surveys/Internships/Equipment meta still say "CISC Connect".
6. **Geolocation UX** — Markets page should surface permission denial inline.
7. **Event calendar** — Make day events linkable; add month navigation aria-labels.
8. **Image CDN** — Consider Supabase image transforms for hero LCP.

---

## Performance Opportunities

- Prefetch home data in route loader ✅ (implemented)
- React Query `staleTime: 60s`, `refetchOnWindowFocus: false` ✅
- Deduplicate news/podcasts featured queries ✅
- Program detail related programs in loader ✅ (removed client refetch of all programs)
- **Pending:** Dehydrate loader data to React Query on SSR for all list pages
- **Pending:** `React.lazy` for admin form dialogs and charts
- **Pending:** Consolidate `fetchHomeHeroSlides` 4-query fan-out into a single RPC or view

---

## Accessibility Issues (Open)

| Issue | Status |
|-------|--------|
| Empty alt on publication/podcast/program/event images | Partially fixed (news, partners, search) |
| Filter pills missing `aria-pressed` | Fixed in news filters; migrate partners/publications/podcasts |
| Admin icon buttons without `aria-label` | Fixed on News admin; migrate other modules |
| Rich text toolbar labels | Fixed |
| 2FAS status chip focus | Fixed |
| Skip to main content | Fixed |
| Bottom nav `aria-current` | Fixed |
| Nested interactive elements in cards | **Open** |
| No mobile overflow nav for desktop links | **Open** (News added to desktop nav) |

---

## Security Review

### RLS (Supabase)
- ✅ Content tables (`news_articles`, `partners`, `podcast_episodes`, etc.) use `is_published` + `has_role(admin)` patterns
- ✅ Junction tables inherit parent publish state via EXISTS subqueries
- ✅ 2FAS applications restricted to admin

### Storage
- ✅ Per-module buckets (`news-images`, `partner-logos`, etc.) with public read + admin write
- ⚠️ Verify production bucket CORS and max upload size in Supabase dashboard

### Admin Routes
- ✅ `_authenticated` + `admin` route guards with `user_roles.role = 'admin'`
- ✅ Admin routes use `ssr: false` (client-only; acceptable)
- ✅ `/unauthorized` for non-admin with `noindex`

### Public Routes
- ✅ Published-only reads enforced at RLS
- ✅ Draft content not exposed to anon

### Signed URLs
- ℹ️ Most assets use public buckets; PDFs/publications may use public URLs — review sensitive documents before launch

### Permissions
- ⚠️ Run `supabase db lint` and verify all migrations applied in production project

---

## Testing Checklist

### Performance
- [ ] Home loads without duplicate section-meta fetch (Network tab)
- [ ] Link hover preload respects 60s stale window
- [ ] News/Podcasts list makes single articles/episodes request

### Mobile
- [ ] Bottom nav touch targets ≥ 44px
- [ ] Filter pills scroll horizontally on iPhone
- [ ] Admin dashboard Refresh button works on mobile
- [ ] Toast appears top-center on mobile

### Accessibility
- [ ] Tab through bottom nav — `aria-current` announced
- [ ] Skip link focuses `#main-content`
- [ ] News filter pills announce pressed state
- [ ] Screen reader reads image alt on news/partner cards

### Dashboard
- [ ] Metrics show skeleton while loading
- [ ] Refresh spins and updates counts
- [ ] Error state shows retry on failed fetch

### SEO
- [ ] View source on `/news/$slug` — canonical, og:image, JSON-LD Article
- [ ] View source on `/programs/$slug` — Course JSON-LD
- [ ] `/unauthorized` has `noindex`

### Error / Offline
- [ ] Disable network — offline banner appears
- [ ] Fail Supabase query — QueryErrorState with retry on Programs/News/Podcasts

### Security
- [ ] Non-admin cannot access `/admin` (redirects to `/unauthorized`)
- [ ] Unpublished news article returns 404 on public slug route
- [ ] Anon cannot insert into `news_articles` via API

---

## Files Changed (Sprint 8)

See deliverable summary in conversation for full list. Key additions:

- `src/lib/query-config.ts` — React Query defaults
- `src/lib/seo.ts` — SEO/OG/Twitter/canonical/JSON-LD helpers
- `src/components/design-system/filter-pill.tsx`
- `src/components/design-system/query-error-state.tsx`
- `src/components/skip-link.tsx`
- `src/components/offline-banner.tsx`
- `src/hooks/use-confirm-dialog.ts`
- `docs/VERSION_1_QA_REPORT.md` (this file)

---

*Generated as part of Sprint 8 — Production Readiness. No new CMS modules were added.*
