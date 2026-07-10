# Sprint 9 Release Notes

**Release:** JESUP V1.0 Beta 2  
**Suggested tag:** `v1.0.0-beta.2`  
**Date:** July 10, 2026  
**Scope:** Sprint 9 — Public engagement, attendance, evaluations, demographics, gallery, reporting

---

## Summary

Sprint 9 delivers the full Cooperative Extension engagement pipeline: public inquiries, event attendance and walk-ins, native post-event evaluations, optional demographic capture with privacy-safe aggregates, participant photo moderation, and printable event reporting with draft/final snapshots.

**Not included:** QR camera scanner, AI-generated narratives, server-generated PDFs.

---

## Phase 9A — Engagement foundation
- Database schema for inquiries, attendance, evaluations, gallery, demographics
- RLS policies for admin, authenticated, and anonymous flows
- Anonymous evaluation RPCs with hashed access tokens

## Phase 9B — Public inquiries
- `/join` Connect inquiry form with consent and honeypot
- Admin inquiry queue at `/admin/inquiries`
- Assignment, status workflow, internal admin notes
- Admin notification on new inquiry

## Phase 9C — Open institution eligibility
- Institution picker with 1890 land-grant support
- Open eligibility for internships and 2FAS applications
- Profile institution fields on `/me`

## Phase 9D — Attendance and walk-ins
- Canonical `event_attendance` with audit trail
- Admin attendance page: manual check-in, walk-ins, CSV import/export
- Attendance summary metrics and filters

## Phase 9E — Native evaluations
- Admin evaluation configuration per event
- Public `/events/$id/evaluation` route
- Identified and anonymous response modes
- Admin response export; evaluation summaries

## Phase 9F — Demographics
- Optional demographic capture (registration, walk-in, evaluation)
- Aggregate-only admin reporting via RPC
- Small-cell suppression (“Fewer than 5”)
- Privacy notice and consent requirements

## Phase 9G — Gallery moderation
- Admin gallery manager: bulk upload, cover, reorder, metadata
- Participant photo submissions with permission confirmation
- Admin moderation queue at `/admin/events/gallery`
- Public gallery shows approved images only

## Phase 9H — Event reporting
- Event Reports dashboard at `/admin/reports/events`
- Multi-event filters, metrics, recharts attendance chart
- Printable report preview with JESUP/CISC branding
- CSV exports (summary, participants, attendance, evaluations, demographics, gallery)
- Report draft/final snapshots

## Phase 9I — Release readiness
- Security and privacy audit documentation
- Migration filename normalization
- Beta release checklist updates
- Known issues and demo script
- Reduced-motion and print CSS hardening

---

## New routes

| Route | Description |
|-------|-------------|
| `/join` | Public inquiry submission |
| `/events/$id/evaluation` | Native post-event evaluation |
| `/admin/inquiries` | Inquiry moderation |
| `/admin/events/$eventId/attendance` | Attendance management |
| `/admin/events/$eventId/evaluations` | Evaluation responses |
| `/admin/events/$eventId/gallery` | Event gallery admin |
| `/admin/events/gallery` | Gallery moderation queue |
| `/admin/reports/events` | Event reporting dashboard |

---

## Breaking / behavioral changes

- Event form gallery tab now links to dedicated gallery manager (no inline gallery save on event save)
- `saveEvent()` no longer deletes/reinserts `event_gallery` rows
- Public `event_gallery` reads require `is_public_approved = true` (RLS)

---

## Upgrade notes

1. Apply all 6 Sprint 9 migrations in order (see `SPRINT_9_MIGRATION_STATUS.md`)
2. Regenerate Supabase types
3. Verify `event-images` participant storage policies
4. Confirm at least one admin user in `user_roles`
5. Run `npm run build` and smoke-test inquiry → attendance → evaluation → report flow

---

## Suggested commit message

```
Sprint 9 complete: engagement, attendance, evaluations, demographics, gallery, reporting, and release hardening
```

## Suggested tag commands

```bash
git tag -a v1.0.0-beta.2 -m "JESUP V1.0 Beta 2 — Sprint 9 engagement and reporting"
git push origin v1.0.0-beta.2
```
