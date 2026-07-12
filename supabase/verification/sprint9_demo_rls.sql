-- Sprint 9 RLS verification (development / staging)
-- Automated runner: node scripts/sprint9_rls_verify.mjs
-- Manual checks below mirror the script expectations.

-- ============================================================
-- PUBLIC INQUIRY
-- ============================================================
-- anon RPC submit_public_inquiry succeeds
-- anon direct SELECT returns 0 rows (RLS deny)
-- anon UPDATE/DELETE affect 0 rows (silent deny — not an error)
-- authenticated non-admin cannot read another user's inquiry
-- admin can read/manage all inquiries and inquiry_notes

-- ============================================================
-- ATTENDANCE
-- ============================================================
-- authenticated non-admin sees only own registration attendance rows
-- walk-in records not visible to non-admin
-- admin can read/write attendance for event

-- ============================================================
-- EVALUATIONS & DEMOGRAPHICS
-- ============================================================
-- event_evaluation_responses not readable cross-user by normal accounts
-- participant_demographics raw rows admin-only
-- get_event_demographic_aggregates returns suppressed buckets when n < 5

-- ============================================================
-- GALLERY
-- ============================================================
-- public event_gallery query with is_public_approved=true returns approved only
-- participant storage path restricted to submissions/{uid}/ (see migration 20260710140000)
-- admin moderation queue can approve submissions

-- ============================================================
-- REPORTS
-- ============================================================
-- event_report_snapshots admin-only for normal users
-- admin can read/create snapshots

-- ============================================================
-- PROFILES & NOTES
-- ============================================================
-- users read own profile
-- inquiry_notes admin-only for non-admin
-- author display uses profiles lookup (client); optional FK 20260711193000 for embed

-- Verification query (admin session): confirm inquiry note authors have profiles
SELECT n.id, n.author_id, p.email
FROM public.inquiry_notes n
LEFT JOIN public.profiles p ON p.id = n.author_id
ORDER BY n.created_at DESC
LIMIT 10;

-- Verification query: FK state (run after optional migration 20260711193000)
SELECT conname, confrelid::regclass AS references_table
FROM pg_constraint
WHERE conrelid = 'public.inquiry_notes'::regclass
  AND contype = 'f'
  AND conkey = (
    SELECT array_agg(attnum)
    FROM pg_attribute
    WHERE attrelid = 'public.inquiry_notes'::regclass AND attname = 'author_id'
  );
