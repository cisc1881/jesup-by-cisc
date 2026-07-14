# Production Smoke Test

**Release:** `v1.0.0-beta.3`  
**Run:** Immediately after production deployment and migration apply  
**Duration:** ~20–30 minutes  
**Prerequisites:** Admin account, non-admin test account, signed-out browser session

---

## Pre-flight (2 minutes)

- [ ] Production URL loads without Supabase env error in browser console
- [ ] `localStorage` / `sessionStorage` cleared on test browsers (fresh sessions)
- [ ] Confirm `user_roles` contains test admin with `role = 'admin'`

---

## 1. App loads

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 1.1 | Open production `/` | Home renders; no blank page | ☐ |
| 1.2 | Check browser console | No `VITE_SUPABASE` missing errors | ☐ |
| 1.3 | Verify HTTPS | No mixed-content warnings | ☐ |

---

## 2. Admin login

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 2.1 | Go to `/auth` | Sign-in form loads | ☐ |
| 2.2 | Sign in as admin | Redirect to `/admin` or intended route | ☐ |
| 2.3 | Open `/admin` | Command Center dashboard loads | ☐ |

---

## 3. Public inquiry submission (signed-out session)

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 3.1 | Open incognito `/join` | Form loads with institution picker | ☐ |
| 3.2 | Fill required fields + consent | Submit enabled | ☐ |
| 3.3 | Submit inquiry | Success confirmation shown | ☐ |
| 3.4 | Note inquiry reference | ID or success message captured | ☐ |

---

## 4. Inquiry notification

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 4.1 | As admin, open notification bell | New `inquiry_received` notification | ☐ |
| 4.2 | Click notification | Navigates to `/admin/inquiries` | ☐ |
| 4.3 | Open inquiry detail | Submitter info matches step 3 | ☐ |

---

## 5. Event registration (non-admin user)

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 5.1 | Sign in as non-admin | `/me` accessible | ☐ |
| 5.2 | Open published event `/events/$id` | Registration panel visible | ☐ |
| 5.3 | Register for event | Confirmation; registered state shown | ☐ |

---

## 6. Attendance check-in (admin)

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 6.1 | Admin → `/admin/events/$eventId/attendance` | Attendance list loads | ☐ |
| 6.2 | Find registration from step 5 | Row present | ☐ |
| 6.3 | Mark checked in / attended | Status updates; summary cards refresh | ☐ |

---

## 7. Evaluation submission (non-admin)

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 7.1 | Open `/events/$id/evaluation` | Native form loads (or CTA if window closed) | ☐ |
| 7.2 | Complete and submit evaluation | Thank-you / completion state | ☐ |
| 7.3 | Admin → evaluations page | Response appears in admin list | ☐ |

---

## 8. Demographic aggregate display (admin)

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 8.1 | On attendance or evaluations admin page | Demographic aggregate cards section visible | ☐ |
| 8.2 | If n &lt; 5 for any cell | Shows "Fewer than 5" suppression | ☐ |
| 8.3 | Confirm no raw demographic rows exposed | Only aggregate categories shown | ☐ |

---

## 9. Participant photo upload (non-admin)

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 9.1 | On event detail → Share a photo | Dialog opens | ☐ |
| 9.2 | Check permission checkbox + upload image | Pending confirmation | ☐ |
| 9.3 | Verify storage path | File under `event-images/submissions/{user_id}/` | ☐ |

---

## 10. Photo moderation (admin)

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 10.1 | Admin → `/admin/events/gallery` | Pending submission visible | ☐ |
| 10.2 | Approve with caption/alt text | Status = approved | ☐ |
| 10.3 | Refresh public event page | Image appears in approved gallery only | ☐ |

---

## 11. Report draft save (admin)

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 11.1 | Admin → `/admin/reports/events` | Dashboard loads with metrics | ☐ |
| 11.2 | Select event(s) + enter narrative fields | Preview updates | ☐ |
| 11.3 | Click Save draft | Draft appears in saved drafts list | ☐ |

---

## 12. Report finalization (admin)

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 12.1 | Click Finalize on draft | Status changes to final | ☐ |
| 12.2 | Modify live event data (optional) | Finalized snapshot metrics unchanged | ☐ |
| 12.3 | Duplicate draft | New draft row created | ☐ |

---

## 13. Print-to-PDF (admin)

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 13.1 | Click Print report | Browser print dialog opens | ☐ |
| 13.2 | Preview print layout | Admin buttons/filters hidden (`.no-print`) | ☐ |
| 13.3 | Save as PDF | JESUP branding readable; sections not clipped | ☐ |

---

## 14. Non-admin access denial

| Step | Action | Expected | Pass |
|------|--------|----------|------|
| 14.1 | As non-admin, open `/admin/inquiries` | Redirect to `/unauthorized` | ☐ |
| 14.2 | As non-admin, open `/admin/reports/events` | Redirect to `/unauthorized` | ☐ |
| 14.3 | Signed-out REST probe (optional) | Anon GET on `inquiries` returns empty/error per RLS | ☐ |

---

## Failure response

| If this fails… | Action |
|----------------|--------|
| Migration-related error | Stop smoke test; consult [PRODUCTION_ROLLBACK_PLAN.md](./PRODUCTION_ROLLBACK_PLAN.md) |
| Storage upload fails | Check `event-images` policies from migration 5 |
| Report draft save fails | Verify `event_report_snapshots` table exists (migration 6) |
| Notification missing | Verify migrations 2–3 applied; check `notifications` table |
| Any P1 failure | **NO-GO** — do not announce production ready |

---

## Sign-off

| Tester | Date | Result |
|--------|------|--------|
| | | ☐ PASS — all critical steps |
| | | ☐ FAIL — see notes |

**Notes:**

---

## v1.0.0-beta.3 additions

After migrations, verify post-beta.2 fixes:

- [ ] Homepage loads with partial-failure resilience (no blank page on single section error)
- [ ] Signed-out `/join` inquiry via RPC succeeds
- [ ] Admin inquiry notes save and reload with author name
- [ ] Admin child routes render on direct navigation: `/admin/events/{id}/attendance`, `/admin/reports/events`
- [ ] Gallery moderation → approved image on public event page

Pre-production dev verification: `node scripts/sprint9_rls_verify.mjs` — expect 21/21 pass.

---

*Companion: [PRODUCTION_READINESS_REVIEW.md](./PRODUCTION_READINESS_REVIEW.md) · [PRODUCTION_MIGRATION_PLAN.md](./PRODUCTION_MIGRATION_PLAN.md)*
