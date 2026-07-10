# Sprint 9 Security Review

**Date:** July 10, 2026  
**Scope:** Sprint 9 engagement, attendance, evaluations, demographics, gallery, reporting  
**Method:** Static code audit + RLS/migration review (not penetration test)

---

## Executive summary

Sprint 9 data access controls are **sound for beta release** with documented residual risks. RLS enforces admin-only access to attendance, demographics, evaluation responses, inquiry notes, and report snapshots. Universal search excludes sensitive tables. No service-role key is bundled in browser code.

**Residual risks (accepted for beta):** public-read `event-images` bucket, CMS HTML rendering without sanitization, `create_admin_notification` callable by any authenticated user, anonymous evaluation resubmit gap.

---

## Role matrix

| Capability | Anonymous | Authenticated user | Admin |
|------------|-----------|-------------------|-------|
| Public CMS content | ✅ Read | ✅ Read | ✅ Read + write |
| Submit inquiry | ✅ Insert (guarded) | ✅ Own insert | ✅ Full |
| View inquiries | ❌ | ✅ Own only | ✅ All |
| Inquiry notes | ❌ | ❌ | ✅ |
| Event registration | ❌ | ✅ Own | ✅ All |
| Attendance records | ❌ | ✅ Own registration | ✅ All |
| Walk-in PII | ❌ | ❌ | ✅ |
| Evaluation responses | ✅ Anonymous RPC | ✅ Own + anonymous | ✅ All |
| Raw demographics | ❌ | ❌ (RPC write only) | ✅ |
| Demographic aggregates | ❌ | ❌ | ✅ RPC |
| Gallery submissions | ❌ | ✅ Own | ✅ Moderate |
| Public gallery | ✅ Approved only | ✅ Approved only | ✅ All |
| Report snapshots | ❌ | ❌ | ✅ |
| Admin routes | ❌ Redirect | ❌ `/unauthorized` | ✅ |

---

## RLS verification

### Inquiries (`inquiries`, `inquiry_notes`)
- Public insert guard trigger forces `status=new`, clears `assigned_to`
- Users: `inquiries select own` (`user_id = auth.uid()`)
- Notes: `inquiry_notes admin all` only

### Attendance (`event_attendance`, `event_walk_ins`)
- `event_attendance select own or admin` — registration ownership check
- Walk-ins: admin-only policies
- Client uses explicit column select (no `checked_in_by` in exports)

### Evaluations (`event_evaluation_responses`, `event_evaluation_answers`)
- Privacy trigger nulls identity fields for anonymous mode
- `access_token_hash` never selected in browser (`RESPONSE_SELECT` in `evaluations.ts`)
- Anonymous path uses one-time plaintext token in sessionStorage only

### Demographics (`participant_demographics`)
- No non-admin SELECT policy
- User writes via `upsert_my_participant_demographics` with ownership validation
- Public API: aggregate RPCs only with admin gate + cell suppression

### Gallery (`event_gallery`, `event_gallery_submissions`)
- Public gallery: `is_public_approved = true` on published events
- Submissions: own insert/select; admin update for moderation
- Storage: participant paths scoped to `submissions/{auth.uid()}/...`

### Report snapshots (`event_report_snapshots`)
- Admin-only CRUD; `created_by = auth.uid()` on insert
- Snapshots store aggregate metrics, not raw demographic rows

---

## Storage policy summary

| Bucket | Public read | Write |
|--------|-------------|-------|
| `event-images` | ✅ All objects | Admin: `gallery/...`; Participant: `submissions/{uid}/...` only |
| `market-images` | ✅ | Admin only |
| `publications` | ✅ (bucket public) | Admin (earlier migration) |
| `partner-logos` | ✅ | Admin only |
| `podcast-images` | ✅ | Admin only |
| `equipment-images` | ✅ | Admin only |
| `resumes` | ❌ Private | User own folder |
| `twofas-documents` | ❌ Private | Application-scoped |
| `media-assets` | Per policy | Admin |

**Known consideration:** `event-images` bucket is public-read. Unapproved participant submission URLs are not linked publicly but are technically accessible if URL is guessed. Approved images are intended for public display.

---

## Service role key

- `src/integrations/supabase/client.server.ts` — server-only, dynamic import pattern
- **No browser imports found**
- `SUPABASE_SERVICE_ROLE_KEY` must never use `VITE_` prefix

---

## Universal search

**File:** `src/lib/search.ts`  
**Tables:** programs, events, markets, publications, internships (open 2FAS only), grants, partners, podcasts, news  
**Excluded:** inquiries, attendance, demographics, evaluations, gallery submissions, profiles, applications

---

## Notification payloads

- No demographic or evaluation answer data in notification bodies
- Inquiry notifications include submitter name (admin audience only)
- `evaluation_submitted` enum exists but no trigger wired (dead type)

**Risk:** `create_admin_notification` granted to `authenticated` — any logged-in user could spam admins. Recommend restricting to `service_role` in a future migration.

---

## Export privacy

| Export | Sensitive data excluded |
|--------|-------------------------|
| Attendance CSV | `checked_in_by`, internal IDs |
| Evaluation CSV | Anonymous name/email blanked |
| Demographic CSV | Aggregate only |
| Participant CSV | No `user_id` |
| Gallery CSV | No submitter email |

---

## Findings and disposition

| ID | Finding | Severity | Disposition |
|----|---------|----------|-------------|
| S1 | Public-read event-images bucket | Medium | Documented; signed URLs deferred |
| S2 | CMS HTML unsanitized (`dangerouslySetInnerHTML`) | Medium | Known issue; admin-trusted content |
| S3 | `create_admin_notification` open to authenticated | Low | Known issue; target V1.1 |
| S4 | Anonymous eval resubmit without `is_complete` guard | Low | Known issue; target V1.1 |
| S5 | Admin route guard client-side only | Low | Acceptable with RLS |
| S6 | No honeypot on evaluation/gallery forms | Low | Acceptable for beta |

---

## Confirmation

- ✅ No service-role key in browser bundle
- ✅ `access_token_hash` not exposed in UI queries
- ✅ Raw demographics not in public APIs
- ✅ Small-cell suppression active in RPC + UI
- ✅ QR scanner not built (no new attack surface)
- ✅ AI narrative not built (no LLM data pipeline)
