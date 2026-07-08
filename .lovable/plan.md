
# CISC Connect — Foundation Build

Responsive web app for Tuskegee University's Center for Integrated and Sustainable Communities. This plan covers the foundation: design system, auth, database, public portal, user dashboard, and admin dashboard with full CRUD. No AI, shelf-life, or notification features.

## Design system

Tokens in `src/styles.css` (oklch equivalents of the hex values):
- `--primary` maroon `#7C2529`
- `--accent` gold `#C9A227`
- `--background` white, `--foreground` dark gray `#2A2A2A`
- Neutral card/border/muted surfaces
- Gold accent bar utility for section headings

Fonts loaded via `<link>` in `__root.tsx` head:
- Playfair Display (headings) → `--font-serif`
- Inter (body) → `--font-sans`

Shared UI: rounded-2xl cards, mobile-first grids, sticky public top nav with mobile sheet menu, collapsible admin sidebar (shadcn Sidebar with `collapsible="icon"`).

## Stack

TanStack Start template as-is, Lovable Cloud for auth/DB/storage, shadcn/ui components. Google Maps deferred — `/markets` uses a list view plus a "map placeholder" card, per the spec.

## Auth

- Email/password + Google (via `lovable.auth.signInWithOAuth("google", ...)` from a public `/auth` route)
- `supabase--configure_social_auth` called for Google in the same turn Google is wired
- `app_role` enum (`admin`, `user`), `user_roles` table, `has_role()` security-definer function
- Root `onAuthStateChange` in `__root.tsx` for router/query invalidation
- `_authenticated/route.tsx` (integration-managed) gates user-only pages
- `_authenticated/admin/route.tsx` additionally checks `has_role(uid,'admin')` in `beforeLoad`; non-admins → `/unauthorized`

## Database (migrations, RLS + GRANTs)

Tables in `public`:
- `profiles` (id fk auth.users, full_name, email, phone, affiliation)
- `user_roles` (user_id, role) with `has_role()` fn
- `markets` (name, description, address, city, state, lat, lng, hours, season, image_url)
- `events` (title, description, starts_at, ends_at, location, capacity, image_url, registration_open)
- `event_registrations` (event_id, user_id, notes, created_at) unique(event_id,user_id)
- `publications` (title, description, category, file_url, external_url, published_at)
- `grants` (title, funder, description, amount, deadline, url)
- `internships` (title, description, department, deadline, is_open)
- `internship_applications` (internship_id, user_id, resume_url, cover_letter, status, created_at)
- `equipment` (name, description, category, quantity_total, image_url)
- `equipment_checkouts` (equipment_id, user_id, quantity, checkout_date, return_date, status enum, notes)
- `surveys` (title, description, qualtrics_url)

RLS pattern per table:
- Public catalogs (markets/events/publications/grants/internships/equipment/surveys): SELECT to `anon, authenticated`; INSERT/UPDATE/DELETE only when `has_role(auth.uid(),'admin')`
- User-owned (event_registrations, internship_applications, equipment_checkouts): user SELECT/INSERT own rows (`auth.uid() = user_id`); admin full access
- `profiles`: user reads/updates own; admin reads all
- `user_roles`: user reads own; admin manages
- Every table ships `GRANT`s to `authenticated` + `service_role`, plus `anon` SELECT where public

Trigger: on new `auth.users` row, insert into `profiles` and grant `user` role.

Storage buckets (created via `supabase--storage_create_bucket`):
- `publications` (public) — PDF uploads
- `market-images`, `event-images`, `equipment-images` (public)
- `resumes` (private) — user reads own, admin reads all

## Routes

Public:
```
/                    Landing: mission, quick links, upcoming events
/auth                Sign in / sign up (email + Google)
/markets             Directory: list + map placeholder card
/events              Upcoming events grid
/events/$id          Detail + register button
/publications        Grid with download / open buttons
/grants              List + detail
/internships         List + apply
/equipment           Catalog + checkout request form
/surveys             Qualtrics link cards
/unauthorized        Access denied
```

Authenticated user:
```
/_authenticated/me   My activity: my registrations, applications, checkouts
```

Admin (under `_authenticated/admin`):
```
/admin                     Dashboard: counts + recent activity
/admin/markets             CRUD
/admin/events              CRUD + per-event registrations viewer
/admin/publications        CRUD (upload PDF to `publications` bucket OR external URL)
/admin/grants              CRUD
/admin/internships         CRUD
/admin/internships/applications   Review applications, update status
/admin/equipment           CRUD inventory
/admin/equipment/requests  Approve / deny / check out / mark returned
/admin/surveys             CRUD Qualtrics links
/admin/users               List users, grant/revoke admin
```

Every list has search + "Export CSV" (client-side helper).

## Server functions (`createServerFn`)

- Public reads use a server publishable-key client (no bearer needed at SSR)
- User-scoped actions use `.middleware([requireSupabaseAuth])`
- Admin mutations additionally call `has_role` before running
- Equipment availability: `requestEquipmentCheckout` sums overlapping `approved` + `checked_out` reservations for the item within `[checkout_date, return_date]` and rejects when `sum + requested > quantity_total`

Representative set: `listMarkets/upsertMarket/deleteMarket`, `listEvents/upsertEvent/deleteEvent/listEventRegistrations`, `registerForEvent`, `listPublications/upsertPublication/deletePublication`, `listGrants/upsert/delete`, `listInternships/upsert/delete`, `applyForInternship/listApplications/updateApplication`, `listEquipment/upsert/delete`, `requestEquipmentCheckout/listCheckouts/updateCheckoutStatus`, `listSurveys/upsert/delete`, `listUsers/setUserRole`.

## CSV export

`src/lib/csv.ts` — `toCsv(rows, columns)` → Blob + download. Wired to each admin list's Export button.

## SEO / head

Each public route sets its own `head()` with `title`, `description`, `og:title`, `og:description`. Landing gets an `og:image` from a generated hero.

## Build order

1. Enable Lovable Cloud
2. Design tokens, fonts, `__root.tsx` metadata + auth listener
3. Migrations: enums, tables, `has_role`, RLS + GRANTs, profile/role trigger; create storage buckets
4. Auth pages, `_authenticated/` + `_authenticated/admin/` layout gates, `/unauthorized`
5. Public shell (sticky nav) + landing
6. Public catalogs (markets, events + detail, publications, grants, internships, equipment, surveys)
7. `/me` user dashboard
8. Admin shell (sidebar) + dashboard + all CRUD screens + CSV export
9. Head metadata polish + mobile QA
