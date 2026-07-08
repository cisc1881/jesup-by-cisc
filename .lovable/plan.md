# JESUP — The Digital Extension Wagon

Rebrand the entire application and elevate it from a university-style site to a premium mobile-first product (Apple / Nike / Spotify feel). All existing CRUD, auth, RLS, admin dashboard, and equipment logic stay intact — this is a design + IA overhaul plus a few new content sections.

## 1. Brand & design system (`src/styles.css`, `__root.tsx`)

- App name everywhere: **JESUP** / subtitle *The Digital Extension Wagon* / "Powered by CISC · Tuskegee University Cooperative Extension".
- Replace maroon/gold palette with the new crimson gradient + neutrals + metallic gold:
  - `--primary` deep crimson `#7A0C16`, `--primary-mid` `#9E1B2F`, `--primary-bright` `#C1273D`
  - `--gradient-primary: linear-gradient(135deg,#7A0C16,#9E1B2F 55%,#C1273D)`
  - Neutrals: bg `#F5F5F3`, card `#FFFFFF`, secondary bg `#ECECEC`, text `#1F1F1F`, muted `#6B6B6B`, border `#D8D8D8`
  - Metallic gold tokens `--gold`, `--gold-light`, `--gold-dark` (`#B08D57 / #C6A15B / #A87B2D`) — reserved for dividers, badges, active indicators, certificates only.
- Typography: keep **Inter** for body, swap Playfair for **Instrument Sans / SF-style** display via existing Inter weights (600/700/800) — no serif. Larger tracking-tight headings.
- Global tokens: `--radius: 1.25rem`, rounded-2xl/3xl cards, soft shadows (`shadow-[0_8px_30px_rgba(0,0,0,0.06)]`), generous spacing.
- Utilities: `.grad-primary`, `.grad-text`, `.gold-divider`, `.card-elevated`, `.fade-in`, `.slide-up`.
- Upload the CISC logo as a Lovable asset (`src/assets/cisc-logo.png.asset.json`) and use it in the footer / powered-by chip.

## 2. Information architecture

New public shell = **mobile-first with bottom tab bar** (5 tabs) on `<md`, top nav on desktop.

Bottom tabs → routes:
1. **Home** `/`
2. **Programs** `/programs` (new hub) — nests existing markets/events/publications logic later
3. **Events** `/events`
4. **Resources** `/resources` (hub linking Publications, Grants, Internships, Equipment, Surveys)
5. **Profile** `/me` (auth-gated, prompts sign-in if signed out)

Secondary routes surfaced from Home / Resources: `/podcast`, `/partners`, `/donate`, plus the existing `/markets`, `/publications`, `/grants`, `/internships`, `/equipment`, `/surveys`, `/auth`.

Admin dashboard stays exactly as-is (styling refreshed to match new tokens; no functional change).

## 3. New / redesigned public screens

### Home `/` — immersive dashboard
- Hero **carousel** (embla) with 3–5 large image slides + crimson gradient overlay: welcome message ("Welcome to JESUP"), today's weather (static placeholder card — no external API this pass), upcoming workshop (from `events`), featured program, latest publication.
- Quick Actions grid: Programs / Events / Podcast / Donate / Partners / Equipment — rounded image cards.
- "Latest from CISC" strip (publications) and "Upcoming" strip (events).

### Programs `/programs` — Apple Fitness-style cards
Static hardcoded list of the 10 named programs, each with cover image (generated), tagline, tag chips. Detail route `/programs/$slug` shows hero, description, related events.

### Podcast `/podcast` — Spotify-style
- Show hero cover + play button (non-functional player UI; audio URL optional per episode)
- Episode cards: cover, title, guest, duration, description, category badge.
- Data: new `podcast_episodes` table + admin CRUD.

### Partners `/partners`
- Grid of logo cards with name, description, website, category filter.
- Data: new `partners` table + admin CRUD.

### Donate `/donate`
- Large hero + mission statement.
- "Ways to Give" cards: Sponsor Programs / Support Students / Support Research.
- Placeholder "Give Online" CTA button (external URL configurable later).

### Resources `/resources`
Hub page linking Publications, Grants, Internships, Equipment, Surveys with icon cards. Existing pages restyled.

### Profile `/me`
Personalized dashboard: greeting, avatar, role chip, tabs for My Registrations / My Applications / My Checkouts (existing data), plus a "Personalize your experience" card teasing future role-based views (Farmer / Student / Faculty / Extension Agent / Community).

## 4. Components to add
- `src/components/bottom-nav.tsx` — fixed bottom tab bar, hides on `md+`.
- `src/components/top-nav.tsx` — refreshed desktop nav with JESUP wordmark + gold divider.
- `src/components/hero-carousel.tsx` — embla-based.
- `src/components/program-card.tsx`, `podcast-card.tsx`, `partner-card.tsx`, `quick-action.tsx`, `section-header.tsx`, `stat-pill.tsx`.
- `src/components/public-layout.tsx` — updated shell (top nav + bottom nav + page padding for tab bar).

## 5. Database additions (single migration)
- `podcast_episodes` (title, slug, guest, duration_seconds, description, cover_url, audio_url, category, published_at, is_published)
- `partners` (name, slug, description, logo_url, website_url, category, sort_order)
- `programs` seeded server-side (static in code — no table needed; keeps admin simple)
- Public `SELECT` for anon+authenticated on published rows; admin full via `has_role('admin')`. Include `GRANT`s per rules.

## 6. Admin additions
- `/admin/podcast` and `/admin/partners` CRUD pages, styled to match refreshed tokens. CSV export wired.
- Sidebar gets two new items.

## 7. Assets
Generate cover imagery with imagegen (fast tier): hero carousel (3 images), 10 program covers, podcast default cover, donate hero, partner placeholder. Save under `src/assets/jesup/*.jpg` and import.

## 8. Out of scope this pass
- Real weather API, real audio playback engine, real payment integration, push notifications, role-personalized profile logic (UI stub only), any AI/shelf-life/pesticide features.

## Build order
1. Design tokens + fonts + utilities (`src/styles.css`, `__root.tsx` title/meta).
2. Migration for `podcast_episodes` + `partners` (await approval).
3. Generate hero + program cover images in parallel.
4. New layout shell + bottom nav + top nav + rebrand text.
5. Redesign Home (`/`) with carousel + quick actions + strips.
6. New routes: `/programs`, `/programs/$slug`, `/podcast`, `/partners`, `/donate`, `/resources`.
7. Restyle existing catalog pages (Events, Publications, Grants, Internships, Equipment, Surveys, Markets, Me, Auth) to new tokens — content/logic unchanged.
8. Admin: add Podcast + Partners CRUD, restyle sidebar/header to new tokens.
9. Verify build + screenshot key screens at mobile viewport.

Confirm and I'll start executing.
