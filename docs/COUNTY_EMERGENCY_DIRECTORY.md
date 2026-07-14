# County Emergency Directory — Sprint 10 Phase 3

## Purpose

Stores **verified** county emergency-management contacts for the JESUP Weather & Emergency Center. Generic guidance is generated in application code — not stored as verified records.

## Database model

Table: `public.county_emergency_contacts`

| Column | Purpose |
|--------|---------|
| `county_name`, `state_name`, `state_code` | County lookup |
| `agency_name`, `primary_phone`, `alternate_phone` | Public contact (phone only when verified) |
| `website_url`, `alert_signup_url`, `shelter_info_url` | Optional resources |
| `weather_radio_guidance`, `emergency_kit_guidance`, `household_storm_protocol` | Preparedness copy |
| `source_name`, `source_url`, `verified_date` | Verification attribution |
| `verification_status` | `verified` or `pending` (do not store `generic`) |
| `is_active`, `archived_at` | Active vs archived records |

Migration: `supabase/migrations/20260712160000_county_emergency_contacts.sql`

## Verification workflow

1. Admin creates a record as **pending** with source URL and agency details.
2. Review official county / state EMA source.
3. Confirm phone number and guidance against trusted source.
4. Set `verification_status = verified`, `verified_date`, and `source_url`.
5. Public card preview in admin confirms display before publish.
6. Archive outdated records — never delete verified history without archival timestamp.

### Trusted-source requirements

- Official county EMA website or state emergency management directory
- Published government phone numbers only
- No third-party aggregators unless cross-verified with government source
- **Never invent or guess phone numbers**

## Public vs admin visibility

| Audience | Can see |
|----------|---------|
| Public | `verified` + `is_active` + `archived_at IS NULL` |
| Admin | All records including pending and archived |

## RLS summary

- **Public read:** verified active non-archived records only (admins also see all via `has_role`)
- **Admin write:** `has_role(auth.uid(), 'admin')` for INSERT/UPDATE/DELETE
- Pending and archived records are **not** readable by anonymous users

## County resolution order (runtime)

1. Supabase verified active record (server function, filtered query)
2. Built-in verified Macon County fallback (`county-directory.ts`)
3. Generic preparedness guidance (no phone)

Directory lookup failure never breaks live weather.

## Admin route

`/admin/weather/counties`

- List / search
- Create / edit
- Mark verified + verification date
- Archive outdated records
- Public card preview

## Migration application (development only)

```bash
cd /Users/mauriceantoine/Projects/jesup-by-cisc
npx supabase db push
# or apply SQL manually against dev project trffktqewlrzziowmspd
```

**Do not apply to production** until release review.

## Initial verified data

- **Macon County, Alabama** — Macon County Emergency Management Agency — `334-724-2626`
- Seeded in migration + built-in fallback

No other counties are fabricated in seed data.
