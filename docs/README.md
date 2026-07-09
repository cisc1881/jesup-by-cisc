# JESUP Documentation

Master documentation for the JESUP platform — the Digital Extension Wagon developed by CISC at Tuskegee University.

## Documents

| Document | Description |
|----------|-------------|
| [JESUP_PRODUCT_SPEC_V1.md](./JESUP_PRODUCT_SPEC_V1.md) | Product vision, users, modules, brand, roadmap |
| [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) | Technical architecture, data flow, security, deployment overview |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | Schema, RLS, enums, junction tables, migrations |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Colors, typography, components, UI standards |
| [API_SPECIFICATION.md](./API_SPECIFICATION.md) | Supabase API surfaces, RPCs, service modules |
| [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) | MVP status, phased delivery plan |
| [AI_ROADMAP.md](./AI_ROADMAP.md) | Future AI services architecture |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Build, migrate, deploy, and environment setup |

## Quick links (codebase)

| Area | Path |
|------|------|
| Routes | `src/routes/` |
| Platform modules | `src/modules/` |
| Domain services | `src/lib/` |
| Design system | `src/components/design-system/` |
| DB migrations | `supabase/migrations/` |
| Generated DB types | `src/integrations/supabase/types.ts` |

## Conventions

- Apply SQL migrations via **Supabase SQL Editor** in chronological order.
- Keep `src/integrations/supabase/types.ts` in sync after schema changes.
- Public routes are stable — add logic in `src/modules/` and `src/lib/`, not URL paths.
- Admin UI is the **JESUP Command Center** at `/admin`.
