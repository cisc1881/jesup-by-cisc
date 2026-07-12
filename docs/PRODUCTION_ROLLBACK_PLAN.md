# Production Rollback Plan

**Release:** `v1.0.0-beta.3`  
**Date:** July 11, 2026  
**Scope:** Application deploy + 29 required database migrations (+ optional FK)

---

## Rollback principles

1. **Application rollback is fast** — redeploy previous Worker version from Cloudflare dashboard
2. **Database rollback is hard** — Sprint 9 migrations are forward-only; prefer restore-from-backup over manual drops
3. **Data loss risk** — inquiries, attendance, evaluations, demographics, and report snapshots created post-deploy will be lost on DB restore
4. **Do not force-push or hard-reset production git** — rollback is infrastructure-level

---

## Decision matrix

| Symptom | Severity | Recommended action |
|---------|----------|-------------------|
| App won't load (Worker/env error) | P1 | Roll back Worker to previous version; fix env vars |
| Single feature broken (e.g. reports) | P2 | Keep app live; hotfix forward; disable feature route if needed |
| Migration partially applied | P1 | Stop migrations; assess state; restore backup if inconsistent |
| RLS blocking all reads | P1 | Restore backup OR emergency policy patch (tech lead only) |
| Data corruption | P1 | Restore backup immediately |
| Performance degradation | P3 | Monitor; scale Supabase; forward fix |

---

## Application rollback (Cloudflare Worker)

**Time estimate:** 5–10 minutes

1. Open Cloudflare dashboard → Workers & Pages → JESUP Worker
2. Navigate to **Deployments** → select last known-good deployment (pre `v1.0.0-beta.3`)
3. Click **Rollback** / **Deploy previous**
4. Verify production URL loads
5. Confirm `/auth` and `/admin` accessible

**Previous known-good tag:** `v1.0.0-beta.1` (or last stable deployment)

**Note:** Rolling back the app does **not** undo database migrations. If new schema is incompatible with old app, coordinate app + DB rollback together.

---

## Database rollback

### Preferred: Supabase point-in-time restore

1. Open Supabase dashboard → Project Settings → Database → Backups
2. Select backup taken **immediately before** Sprint 9 migration window
3. Initiate restore (creates new project or restores in place per Supabase plan)
4. Update `VITE_SUPABASE_*` and Worker secrets if project ref changes
5. Re-run smoke test on restored environment

**Data impact:** All production data after backup timestamp is lost.

### Alternative: Forward corrective migration

Use only for **non-destructive** issues (e.g. broken trigger, missing policy):

```sql
-- Example: disable inquiry notification if spamming
DROP TRIGGER IF EXISTS notify_inquiry_received ON public.inquiries;
```

Document every corrective SQL in incident log. Do **not** drop `participant_demographics` without legal/privacy review.

### Sprint 9 migration-specific rollback notes

| Migration | Safe to partially reverse? | Notes |
|-----------|---------------------------|-------|
| `20260710120000` | ❌ No | Core tables; restore only |
| `20260710120100` | ❌ No | Enum values cannot be removed |
| `20260710120200` | ✅ Yes | `DROP TRIGGER notify_inquiry_received` |
| `20260710130000` | ✅ Yes | `DROP FUNCTION` aggregate RPCs |
| `20260710140000` | ✅ Yes | Drop storage policies + index |
| `20260710150000` | ⚠️ Partial | `DROP TABLE event_report_snapshots` loses saved reports |

---

## Storage rollback

| Action | Command / procedure |
|--------|-------------------|
| Disable participant uploads | Drop participant storage policies (migration 5 rollback SQL) |
| Remove bad public image | Admin delete via gallery manager or storage dashboard |
| Revert bucket to private | **Not recommended mid-demo** — requires signed URL code change |

Participant files in `event-images/submissions/` persist after app rollback. Moderate/delete sensitive uploads manually if incident involves leaked URLs.

---

## Incident response checklist

| Step | Owner | Done |
|------|-------|------|
| 1. Declare incident; assign incident commander | Tech lead | ☐ |
| 2. Capture error messages, timestamps, affected users | On-call | ☐ |
| 3. Check Supabase logs + Cloudflare Worker logs | Ops | ☐ |
| 4. Decide: forward fix vs rollback (use matrix above) | Tech lead + Product | ☐ |
| 5. Execute rollback procedure | Ops | ☐ |
| 6. Notify CISC leadership if public-facing outage > 15 min | Product | ☐ |
| 7. Post-incident review within 48 hours | Team | ☐ |

---

## Incident contacts (fill before deploy)

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Incident commander | | | |
| Technical lead | | | |
| Supabase / DBA | | | |
| Cloudflare / hosting | | | |
| CISC product owner | | | |

---

## Communication templates

### Internal — rollback initiated

> JESUP production rollback initiated at [TIME] UTC due to [REASON]. Previous Worker version redeployed. Database state: [unchanged / restoring from backup]. ETA to stable: [X] minutes. Next update: [TIME].

### External — user-facing (if needed)

> JESUP is temporarily unavailable while we apply a brief maintenance fix. We expect to be back shortly. Thank you for your patience.

---

## Post-rollback verification

- [ ] Production URL loads
- [ ] Admin login works
- [ ] Public pages render
- [ ] No elevated error rate in logs (30-minute watch)
- [ ] Document root cause and forward fix plan

---

## Prevention for next deploy

1. Always take Supabase backup before migrations
2. Apply migrations to staging first (same 6-file order)
3. Run full [PRODUCTION_SMOKE_TEST.md](./PRODUCTION_SMOKE_TEST.md) on staging
4. Keep previous Worker deployment tagged in Cloudflare
5. Deploy during agreed maintenance window with incident contact on standby

---

*Companion: [PRODUCTION_MIGRATION_PLAN.md](./PRODUCTION_MIGRATION_PLAN.md) · [PRODUCTION_READINESS_REVIEW.md](./PRODUCTION_READINESS_REVIEW.md)*
