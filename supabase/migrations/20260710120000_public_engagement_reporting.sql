-- Sprint 9 Phase 9A: Public engagement, attendance, evaluation, and reporting foundation
-- Safe to run once on the current JESUP remote schema (additive only).

-- ============================================================
-- ENUMS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE public.inquiry_type AS ENUM (
    'join_program',
    'request_info',
    'partnership',
    'student_opportunity',
    'farmer_producer',
    'volunteer',
    'general'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.inquiry_status AS ENUM (
    'new',
    'contacted',
    'in_progress',
    'resolved',
    'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.preferred_contact_method AS ENUM ('email', 'phone', 'either');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.institution_type AS ENUM (
    'land_grant_1890',
    'four_year',
    'community_college',
    'high_school',
    'technical_school',
    'recent_graduate',
    'not_enrolled',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.academic_level AS ENUM (
    'high_school',
    'undergraduate',
    'graduate',
    'recent_graduate',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM (
    'registered',
    'checked_in',
    'attended',
    'virtual',
    'no_show',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.attendance_method AS ENUM ('qr', 'manual', 'csv_import', 'walk_in');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.evaluation_question_type AS ENUM (
    'rating',
    'single_choice',
    'multi_choice',
    'short_text',
    'long_text',
    'yes_no',
    'number',
    'demographic',
    'consent'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.evaluation_response_mode AS ENUM ('anonymous', 'identified');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.gallery_submission_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.demographic_source_type AS ENUM (
    'registration',
    'walk_in',
    'evaluation',
    'attendance'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- notification_type extensions moved to 20260710120100_notification_type_extensions.sql
-- inquiry trigger moved to 20260710120200_inquiry_notification_trigger.sql

-- ============================================================
-- INSTITUTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  institution_type public.institution_type NOT NULL DEFAULT 'other',
  state TEXT,
  website TEXT,
  is_1890_land_grant BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_institutions_active_sort
  ON public.institutions (is_active, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_institutions_state
  ON public.institutions (state);

CREATE INDEX IF NOT EXISTS idx_institutions_1890
  ON public.institutions (is_1890_land_grant)
  WHERE is_1890_land_grant = true;

DROP TRIGGER IF EXISTS trg_institutions_updated ON public.institutions;
CREATE TRIGGER trg_institutions_updated
  BEFORE UPDATE ON public.institutions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

GRANT SELECT ON public.institutions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institutions TO authenticated;
GRANT ALL ON public.institutions TO service_role;

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "institutions public read active" ON public.institutions;
CREATE POLICY "institutions public read active"
  ON public.institutions FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "institutions admin write" ON public.institutions;
CREATE POLICY "institutions admin write"
  ON public.institutions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed recognized 1890 land-grant institutions + Other institution fallback
INSERT INTO public.institutions (name, slug, institution_type, state, is_1890_land_grant, sort_order)
VALUES
  ('Alabama A&M University', 'alabama-a-and-m-university', 'land_grant_1890', 'AL', true, 1),
  ('Alcorn State University', 'alcorn-state-university', 'land_grant_1890', 'MS', true, 2),
  ('Central State University', 'central-state-university', 'land_grant_1890', 'OH', true, 3),
  ('Delaware State University', 'delaware-state-university', 'land_grant_1890', 'DE', true, 4),
  ('Florida A&M University', 'florida-a-and-m-university', 'land_grant_1890', 'FL', true, 5),
  ('Fort Valley State University', 'fort-valley-state-university', 'land_grant_1890', 'GA', true, 6),
  ('Kentucky State University', 'kentucky-state-university', 'land_grant_1890', 'KY', true, 7),
  ('Langston University', 'langston-university', 'land_grant_1890', 'OK', true, 8),
  ('Lincoln University', 'lincoln-university', 'land_grant_1890', 'MO', true, 9),
  ('North Carolina A&T State University', 'north-carolina-a-and-t-state-university', 'land_grant_1890', 'NC', true, 10),
  ('Prairie View A&M University', 'prairie-view-a-and-m-university', 'land_grant_1890', 'TX', true, 11),
  ('South Carolina State University', 'south-carolina-state-university', 'land_grant_1890', 'SC', true, 12),
  ('Southern University and A&M College', 'southern-university-and-a-and-m-college', 'land_grant_1890', 'LA', true, 13),
  ('Tennessee State University', 'tennessee-state-university', 'land_grant_1890', 'TN', true, 14),
  ('Tuskegee University', 'tuskegee-university', 'land_grant_1890', 'AL', true, 15),
  ('University of Arkansas at Pine Bluff', 'university-of-arkansas-at-pine-bluff', 'land_grant_1890', 'AR', true, 16),
  ('University of Maryland Eastern Shore', 'university-of-maryland-eastern-shore', 'land_grant_1890', 'MD', true, 17),
  ('Virginia State University', 'virginia-state-university', 'land_grant_1890', 'VA', true, 18),
  ('West Virginia State University', 'west-virginia-state-university', 'land_grant_1890', 'WV', true, 19),
  ('Other institution', 'other', 'other', NULL, false, 999)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- INQUIRIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_contact public.preferred_contact_method NOT NULL DEFAULT 'either',
  organization_or_school TEXT,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  institution_type public.institution_type,
  city TEXT,
  state TEXT,
  county TEXT,
  inquiry_type public.inquiry_type NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  message TEXT,
  consent_contact BOOLEAN NOT NULL DEFAULT false,
  newsletter_opt_in BOOLEAN NOT NULL DEFAULT false,
  status public.inquiry_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.inquiries
    ADD CONSTRAINT inquiries_consent_required CHECK (consent_contact = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries (status);
CREATE INDEX IF NOT EXISTS idx_inquiries_type ON public.inquiries (inquiry_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_state ON public.inquiries (state);
CREATE INDEX IF NOT EXISTS idx_inquiries_county ON public.inquiries (county);
CREATE INDEX IF NOT EXISTS idx_inquiries_submitted_at ON public.inquiries (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_to ON public.inquiries (assigned_to);
CREATE INDEX IF NOT EXISTS idx_inquiries_program_id ON public.inquiries (program_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_institution_id ON public.inquiries (institution_id);

DROP TRIGGER IF EXISTS trg_inquiries_updated ON public.inquiries;
CREATE TRIGGER trg_inquiries_updated
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inquiries public insert" ON public.inquiries;
DROP POLICY IF EXISTS "inquiries anon insert" ON public.inquiries;
DROP POLICY IF EXISTS "inquiries authenticated public insert" ON public.inquiries;

CREATE POLICY "inquiries anon insert"
  ON public.inquiries FOR INSERT TO anon
  WITH CHECK (
    consent_contact = true
    AND status = 'new'::public.inquiry_status
    AND assigned_to IS NULL
    AND user_id IS NULL
  );

CREATE POLICY "inquiries authenticated public insert"
  ON public.inquiries FOR INSERT TO authenticated
  WITH CHECK (
    NOT public.has_role(auth.uid(), 'admin')
    AND consent_contact = true
    AND status = 'new'::public.inquiry_status
    AND assigned_to IS NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "inquiries select own" ON public.inquiries;
CREATE POLICY "inquiries select own"
  ON public.inquiries FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "inquiries admin all" ON public.inquiries;
CREATE POLICY "inquiries admin all"
  ON public.inquiries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.trg_inquiries_public_insert_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  NEW.status := 'new';
  NEW.assigned_to := NULL;
  NEW.submitted_at := COALESCE(NEW.submitted_at, now());

  IF auth.uid() IS NULL THEN
    NEW.user_id := NULL;
  ELSIF NEW.user_id IS NOT NULL AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'inquiries may not assign another user_id';
  END IF;

  IF NEW.consent_contact IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'consent_contact is required';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inquiries_public_insert_guard ON public.inquiries;
CREATE TRIGGER inquiries_public_insert_guard
  BEFORE INSERT ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.trg_inquiries_public_insert_guard();

-- ============================================================
-- INQUIRY NOTES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.inquiry_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_notes_inquiry_id ON public.inquiry_notes (inquiry_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiry_notes TO authenticated;
GRANT ALL ON public.inquiry_notes TO service_role;

ALTER TABLE public.inquiry_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inquiry_notes admin all" ON public.inquiry_notes;
CREATE POLICY "inquiry_notes admin all"
  ON public.inquiry_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- PROFILE & APPLICATION INSTITUTION FIELDS
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS institution_type public.institution_type,
  ADD COLUMN IF NOT EXISTS school_name TEXT,
  ADD COLUMN IF NOT EXISTS is_1890_land_grant BOOLEAN,
  ADD COLUMN IF NOT EXISTS academic_level public.academic_level,
  ADD COLUMN IF NOT EXISTS major_or_interest TEXT,
  ADD COLUMN IF NOT EXISTS expected_graduation_year INT;

CREATE INDEX IF NOT EXISTS idx_profiles_institution_id ON public.profiles (institution_id);

ALTER TABLE public.internship_applications
  ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS institution_type public.institution_type,
  ADD COLUMN IF NOT EXISTS is_1890_land_grant BOOLEAN,
  ADD COLUMN IF NOT EXISTS academic_level public.academic_level;

CREATE INDEX IF NOT EXISTS idx_internship_applications_institution_id
  ON public.internship_applications (institution_id);

-- ============================================================
-- PARTICIPANT DEMOGRAPHICS (admin-only reads; sensitive data)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.participant_demographics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type public.demographic_source_type NOT NULL,
  source_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  age_range TEXT,
  race TEXT,
  ethnicity TEXT,
  gender TEXT,
  veteran_status TEXT,
  disability_status TEXT,
  farmer_producer_status TEXT,
  beginning_farmer BOOLEAN,
  limited_resource_producer BOOLEAN,
  county TEXT,
  state TEXT,
  rural_urban TEXT,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  academic_level public.academic_level,
  consent_demographics BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_participant_demographics_source
  ON public.participant_demographics (source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_participant_demographics_user_id
  ON public.participant_demographics (user_id);

CREATE INDEX IF NOT EXISTS idx_participant_demographics_county
  ON public.participant_demographics (county);

CREATE INDEX IF NOT EXISTS idx_participant_demographics_state
  ON public.participant_demographics (state);

CREATE INDEX IF NOT EXISTS idx_participant_demographics_institution_id
  ON public.participant_demographics (institution_id);

DROP TRIGGER IF EXISTS trg_participant_demographics_updated ON public.participant_demographics;
CREATE TRIGGER trg_participant_demographics_updated
  BEFORE UPDATE ON public.participant_demographics
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.participant_demographics TO authenticated;
GRANT ALL ON public.participant_demographics TO service_role;

ALTER TABLE public.participant_demographics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demographics admin select" ON public.participant_demographics;
CREATE POLICY "demographics admin select"
  ON public.participant_demographics FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "demographics insert own or admin" ON public.participant_demographics;

DROP POLICY IF EXISTS "demographics admin insert" ON public.participant_demographics;
CREATE POLICY "demographics admin insert"
  ON public.participant_demographics FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "demographics admin update" ON public.participant_demographics;
CREATE POLICY "demographics admin update"
  ON public.participant_demographics FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "demographics admin delete" ON public.participant_demographics;
CREATE POLICY "demographics admin delete"
  ON public.participant_demographics FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- EVENT ATTENDANCE & WALK-INS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.event_walk_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  organization_or_school TEXT,
  county TEXT,
  state TEXT,
  attendance_type public.attendance_status NOT NULL DEFAULT 'attended',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_walk_ins_event_id ON public.event_walk_ins (event_id);

DROP TRIGGER IF EXISTS trg_event_walk_ins_updated ON public.event_walk_ins;
CREATE TRIGGER trg_event_walk_ins_updated
  BEFORE UPDATE ON public.event_walk_ins
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_walk_ins TO authenticated;
GRANT ALL ON public.event_walk_ins TO service_role;

ALTER TABLE public.event_walk_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_walk_ins admin all" ON public.event_walk_ins;
CREATE POLICY "event_walk_ins admin all"
  ON public.event_walk_ins FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.event_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE RESTRICT,
  walk_in_id UUID REFERENCES public.event_walk_ins(id) ON DELETE RESTRICT,
  status public.attendance_status NOT NULL DEFAULT 'registered',
  attendance_method public.attendance_method,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  evaluation_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.event_attendance
    ADD CONSTRAINT event_attendance_source_check CHECK (
      (registration_id IS NOT NULL AND walk_in_id IS NULL)
      OR (registration_id IS NULL AND walk_in_id IS NOT NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON public.event_attendance (event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_status ON public.event_attendance (status);
CREATE INDEX IF NOT EXISTS idx_event_attendance_registration_id ON public.event_attendance (registration_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_walk_in_id ON public.event_attendance (walk_in_id);

-- Use explicit custom unique-index names to avoid collisions with orphaned
-- PostgreSQL auto-generated relation names from an earlier failed attempt.
CREATE UNIQUE INDEX IF NOT EXISTS uq_event_attendance_registration
  ON public.event_attendance (registration_id)
  WHERE registration_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_event_attendance_walk_in
  ON public.event_attendance (walk_in_id)
  WHERE walk_in_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_event_attendance_updated ON public.event_attendance;
CREATE TRIGGER trg_event_attendance_updated
  BEFORE UPDATE ON public.event_attendance
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_attendance TO authenticated;
GRANT ALL ON public.event_attendance TO service_role;

ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_attendance select own or admin" ON public.event_attendance;
CREATE POLICY "event_attendance select own or admin"
  ON public.event_attendance FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.event_registrations er
      WHERE er.id = event_attendance.registration_id
        AND er.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "event_attendance admin write" ON public.event_attendance;
CREATE POLICY "event_attendance admin write"
  ON public.event_attendance FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "event_attendance admin update" ON public.event_attendance;
CREATE POLICY "event_attendance admin update"
  ON public.event_attendance FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "event_attendance admin delete" ON public.event_attendance;
CREATE POLICY "event_attendance admin delete"
  ON public.event_attendance FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.trg_validate_event_attendance_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  IF NEW.registration_id IS NOT NULL THEN
    SELECT er.event_id INTO v_event_id
    FROM public.event_registrations er
    WHERE er.id = NEW.registration_id;

    IF v_event_id IS NULL THEN
      RAISE EXCEPTION 'registration_id does not exist';
    END IF;

    IF v_event_id IS DISTINCT FROM NEW.event_id THEN
      RAISE EXCEPTION 'registration_id does not belong to event_id';
    END IF;
  END IF;

  IF NEW.walk_in_id IS NOT NULL THEN
    SELECT ew.event_id INTO v_event_id
    FROM public.event_walk_ins ew
    WHERE ew.id = NEW.walk_in_id;

    IF v_event_id IS NULL THEN
      RAISE EXCEPTION 'walk_in_id does not exist';
    END IF;

    IF v_event_id IS DISTINCT FROM NEW.event_id THEN
      RAISE EXCEPTION 'walk_in_id does not belong to event_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_event_attendance_event ON public.event_attendance;
CREATE TRIGGER validate_event_attendance_event
  BEFORE INSERT OR UPDATE ON public.event_attendance
  FOR EACH ROW EXECUTE FUNCTION public.trg_validate_event_attendance_event();

-- Backfill attendance from existing registrations (preserves current data)
INSERT INTO public.event_attendance (
  event_id,
  registration_id,
  status,
  attendance_method,
  checked_in_at,
  created_at,
  updated_at
)
SELECT
  er.event_id,
  er.id,
  CASE
    WHEN er.status = 'cancelled'::public.event_registration_record_status THEN 'cancelled'::public.attendance_status
    WHEN er.checked_in_at IS NOT NULL THEN 'checked_in'::public.attendance_status
    ELSE 'registered'::public.attendance_status
  END,
  CASE WHEN er.checked_in_at IS NOT NULL THEN 'manual'::public.attendance_method ELSE NULL END,
  er.checked_in_at,
  er.created_at,
  COALESCE(er.updated_at, er.created_at)
FROM public.event_registrations er
WHERE NOT EXISTS (
  SELECT 1
  FROM public.event_attendance ea
  WHERE ea.registration_id = er.id
);

-- ============================================================
-- EVENT EVALUATIONS (native + Qualtrics)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.event_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Post-event evaluation',
  qualtrics_url TEXT,
  use_native_form BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN NOT NULL DEFAULT false,
  response_mode public.evaluation_response_mode NOT NULL DEFAULT 'anonymous',
  opens_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_event_evaluations_updated ON public.event_evaluations;
CREATE TRIGGER trg_event_evaluations_updated
  BEFORE UPDATE ON public.event_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.event_evaluation_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES public.event_evaluations(id) ON DELETE RESTRICT,
  sort_order INT NOT NULL DEFAULT 0,
  question_type public.evaluation_question_type NOT NULL,
  prompt TEXT NOT NULL,
  help_text TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  options JSONB,
  is_demographic BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_evaluation_questions_eval
  ON public.event_evaluation_questions (evaluation_id, sort_order);

DROP TRIGGER IF EXISTS trg_event_evaluation_questions_updated ON public.event_evaluation_questions;
CREATE TRIGGER trg_event_evaluation_questions_updated
  BEFORE UPDATE ON public.event_evaluation_questions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.event_evaluation_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES public.event_evaluations(id) ON DELETE RESTRICT,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE SET NULL,
  attendance_id UUID REFERENCES public.event_attendance(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_evaluation_responses DROP COLUMN IF EXISTS access_token;
ALTER TABLE public.event_evaluation_responses
  ADD COLUMN IF NOT EXISTS access_token_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_event_evaluation_responses_access_token_hash
  ON public.event_evaluation_responses (access_token_hash)
  WHERE access_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_evaluation_responses_event_id
  ON public.event_evaluation_responses (event_id);

CREATE INDEX IF NOT EXISTS idx_event_evaluation_responses_evaluation_id
  ON public.event_evaluation_responses (evaluation_id);

CREATE INDEX IF NOT EXISTS idx_event_evaluation_responses_user_id
  ON public.event_evaluation_responses (user_id);

CREATE INDEX IF NOT EXISTS idx_event_evaluation_responses_attendance_id
  ON public.event_evaluation_responses (attendance_id);

DROP TRIGGER IF EXISTS trg_event_evaluation_responses_updated ON public.event_evaluation_responses;
CREATE TRIGGER trg_event_evaluation_responses_updated
  BEFORE UPDATE ON public.event_evaluation_responses
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.event_evaluation_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.event_evaluation_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.event_evaluation_questions(id) ON DELETE RESTRICT,
  value_text TEXT,
  value_number NUMERIC,
  value_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (response_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_event_evaluation_answers_response_id
  ON public.event_evaluation_answers (response_id);

GRANT SELECT ON public.event_evaluations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_evaluations TO authenticated;
GRANT ALL ON public.event_evaluations TO service_role;

GRANT SELECT ON public.event_evaluation_questions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_evaluation_questions TO authenticated;
GRANT ALL ON public.event_evaluation_questions TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.event_evaluation_responses TO authenticated;
GRANT ALL ON public.event_evaluation_responses TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.event_evaluation_answers TO authenticated;
GRANT ALL ON public.event_evaluation_answers TO service_role;

ALTER TABLE public.event_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_evaluation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_evaluation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_evaluation_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_evaluations public read active published" ON public.event_evaluations;
CREATE POLICY "event_evaluations public read active published"
  ON public.event_evaluations FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_evaluations.event_id
        AND e.status = 'published'
        AND e.is_active = true
    )
  );

DROP POLICY IF EXISTS "event_evaluations admin write" ON public.event_evaluations;
CREATE POLICY "event_evaluations admin write"
  ON public.event_evaluations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "event_evaluation_questions public read active" ON public.event_evaluation_questions;
CREATE POLICY "event_evaluation_questions public read active"
  ON public.event_evaluation_questions FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.event_evaluations ev
      JOIN public.events e ON e.id = ev.event_id
      WHERE ev.id = event_evaluation_questions.evaluation_id
        AND ev.is_active = true
        AND e.status = 'published'
        AND e.is_active = true
    )
  );

DROP POLICY IF EXISTS "event_evaluation_questions admin write" ON public.event_evaluation_questions;
CREATE POLICY "event_evaluation_questions admin write"
  ON public.event_evaluation_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "event_evaluation_responses select own or admin" ON public.event_evaluation_responses;
CREATE POLICY "event_evaluation_responses select own or admin"
  ON public.event_evaluation_responses FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (user_id IS NOT NULL AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "event_evaluation_responses insert own or admin" ON public.event_evaluation_responses;
CREATE POLICY "event_evaluation_responses insert own or admin"
  ON public.event_evaluation_responses FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      user_id IS NOT NULL
      AND user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.trg_event_evaluation_response_privacy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mode public.evaluation_response_mode;
BEGIN
  SELECT ev.response_mode INTO v_mode
  FROM public.event_evaluations ev
  WHERE ev.id = NEW.evaluation_id;

  IF v_mode IS NULL THEN
    RAISE EXCEPTION 'evaluation not found';
  END IF;

  IF v_mode = 'anonymous' THEN
    NEW.user_id := NULL;
    NEW.registration_id := NULL;
    NEW.attendance_id := NULL;
  ELSE
    IF NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'identified evaluation responses require user_id';
    END IF;
    IF NEW.user_id IS DISTINCT FROM auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'identified evaluation responses must belong to the current user';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_evaluation_response_privacy ON public.event_evaluation_responses;
CREATE TRIGGER event_evaluation_response_privacy
  BEFORE INSERT OR UPDATE ON public.event_evaluation_responses
  FOR EACH ROW EXECUTE FUNCTION public.trg_event_evaluation_response_privacy();

CREATE OR REPLACE FUNCTION public.mark_my_attendance_evaluation_complete(p_attendance_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.event_attendance ea
  SET evaluation_completed_at = now(), updated_at = now()
  FROM public.event_registrations er
  WHERE ea.id = p_attendance_id
    AND ea.registration_id = er.id
    AND er.user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'attendance not found or not owned by current user';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_my_attendance_evaluation_complete(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.hash_evaluation_access_token(p_token TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public, extensions
AS $$
  SELECT encode(
    extensions.digest(p_token::text, 'sha256'::text),
    'hex'
  );
$$;

CREATE OR REPLACE FUNCTION public.create_anonymous_evaluation_response(p_evaluation_id UUID)
RETURNS TABLE (response_id UUID, access_token TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eval public.event_evaluations%ROWTYPE;
  v_token TEXT;
  v_response_id UUID;
BEGIN
  SELECT * INTO v_eval
  FROM public.event_evaluations ev
  WHERE ev.id = p_evaluation_id;

  IF v_eval.id IS NULL THEN
    RAISE EXCEPTION 'evaluation not found';
  END IF;

  IF v_eval.response_mode IS DISTINCT FROM 'anonymous'::public.evaluation_response_mode THEN
    RAISE EXCEPTION 'evaluation is not anonymous';
  END IF;

  IF v_eval.is_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'evaluation is not active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = v_eval.event_id
      AND e.status = 'published'
      AND e.is_active = true
  ) THEN
    RAISE EXCEPTION 'evaluation event is not publicly available';
  END IF;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  INSERT INTO public.event_evaluation_responses (
    evaluation_id,
    event_id,
    access_token_hash,
    is_complete
  ) VALUES (
    v_eval.id,
    v_eval.event_id,
    public.hash_evaluation_access_token(v_token),
    false
  )
  RETURNING id INTO v_response_id;

  response_id := v_response_id;
  access_token := v_token;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_anonymous_evaluation_answers(
  p_response_id UUID,
  p_access_token TEXT,
  p_answers JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_response public.event_evaluation_responses%ROWTYPE;
  v_answer JSONB;
  v_question_id UUID;
BEGIN
  IF p_access_token IS NULL OR length(trim(p_access_token)) = 0 THEN
    RAISE EXCEPTION 'access token is required';
  END IF;

  SELECT * INTO v_response
  FROM public.event_evaluation_responses r
  WHERE r.id = p_response_id
    AND r.access_token_hash = public.hash_evaluation_access_token(p_access_token);

  IF v_response.id IS NULL THEN
    RAISE EXCEPTION 'invalid response or access token';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.event_evaluations ev
    WHERE ev.id = v_response.evaluation_id
      AND ev.response_mode = 'anonymous'::public.evaluation_response_mode
      AND ev.is_active = true
  ) THEN
    RAISE EXCEPTION 'evaluation is not available for anonymous submission';
  END IF;

  IF jsonb_typeof(p_answers) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'answers must be a JSON array';
  END IF;

  FOR v_answer IN SELECT value FROM jsonb_array_elements(p_answers)
  LOOP
    v_question_id := (v_answer->>'question_id')::UUID;

    IF v_question_id IS NULL THEN
      RAISE EXCEPTION 'each answer requires question_id';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.event_evaluation_questions q
      WHERE q.id = v_question_id
        AND q.evaluation_id = v_response.evaluation_id
    ) THEN
      RAISE EXCEPTION 'question does not belong to evaluation';
    END IF;

    INSERT INTO public.event_evaluation_answers (
      response_id,
      question_id,
      value_text,
      value_number,
      value_json
    ) VALUES (
      v_response.id,
      v_question_id,
      NULLIF(v_answer->>'value_text', ''),
      NULLIF(v_answer->>'value_number', '')::NUMERIC,
      v_answer->'value_json'
    )
    ON CONFLICT (response_id, question_id) DO UPDATE SET
      value_text = EXCLUDED.value_text,
      value_number = EXCLUDED.value_number,
      value_json = EXCLUDED.value_json;
  END LOOP;

  UPDATE public.event_evaluation_responses
  SET
    is_complete = true,
    submitted_at = now(),
    updated_at = now()
  WHERE id = v_response.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_anonymous_evaluation_response(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_anonymous_evaluation_answers(UUID, TEXT, JSONB) TO anon, authenticated;

DROP POLICY IF EXISTS "event_evaluation_responses update own or admin" ON public.event_evaluation_responses;
CREATE POLICY "event_evaluation_responses update own or admin"
  ON public.event_evaluation_responses FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (user_id IS NOT NULL AND user_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (user_id IS NOT NULL AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "event_evaluation_answers select own or admin" ON public.event_evaluation_answers;
CREATE POLICY "event_evaluation_answers select own or admin"
  ON public.event_evaluation_answers FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.event_evaluation_responses r
      WHERE r.id = event_evaluation_answers.response_id
        AND r.user_id IS NOT NULL
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "event_evaluation_answers insert own or admin" ON public.event_evaluation_answers;
CREATE POLICY "event_evaluation_answers insert own or admin"
  ON public.event_evaluation_answers FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.event_evaluation_responses r
      WHERE r.id = event_evaluation_answers.response_id
        AND r.user_id IS NOT NULL
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "event_evaluation_answers update own or admin" ON public.event_evaluation_answers;
CREATE POLICY "event_evaluation_answers update own or admin"
  ON public.event_evaluation_answers FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.event_evaluation_responses r
      WHERE r.id = event_evaluation_answers.response_id
        AND r.user_id IS NOT NULL
        AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.event_evaluation_responses r
      WHERE r.id = event_evaluation_answers.response_id
        AND r.user_id IS NOT NULL
        AND r.user_id = auth.uid()
    )
  );

-- Migrate legacy Qualtrics-only survey rows into event_evaluations
INSERT INTO public.event_evaluations (
  event_id,
  title,
  qualtrics_url,
  use_native_form,
  is_active,
  response_mode,
  created_at,
  updated_at
)
SELECT
  es.event_id,
  es.title,
  es.qualtrics_url,
  false,
  es.is_active,
  'anonymous'::public.evaluation_response_mode,
  es.created_at,
  es.updated_at
FROM public.event_surveys es
ON CONFLICT (event_id) DO NOTHING;

-- ============================================================
-- EVENT GALLERY EXTENSIONS & PARTICIPANT SUBMISSIONS
-- ============================================================

ALTER TABLE public.event_gallery
  ADD COLUMN IF NOT EXISTS alt_text TEXT,
  ADD COLUMN IF NOT EXISTS is_cover BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_public_approved BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS photographer_or_source TEXT,
  ADD COLUMN IF NOT EXISTS photo_release_status TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'admin';

CREATE TABLE IF NOT EXISTS public.event_gallery_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  has_permission_confirmed BOOLEAN NOT NULL DEFAULT false,
  status public.gallery_submission_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  gallery_id UUID REFERENCES public.event_gallery(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.event_gallery_submissions
    ADD CONSTRAINT event_gallery_submissions_permission_check CHECK (has_permission_confirmed = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_gallery_submissions_event_id
  ON public.event_gallery_submissions (event_id, status);

CREATE INDEX IF NOT EXISTS idx_event_gallery_submissions_user_id
  ON public.event_gallery_submissions (user_id);

DROP TRIGGER IF EXISTS trg_event_gallery_submissions_updated ON public.event_gallery_submissions;
CREATE TRIGGER trg_event_gallery_submissions_updated
  BEFORE UPDATE ON public.event_gallery_submissions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.event_gallery_submissions TO authenticated;
GRANT ALL ON public.event_gallery_submissions TO service_role;

ALTER TABLE public.event_gallery_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_gallery_submissions select own or admin" ON public.event_gallery_submissions;
CREATE POLICY "event_gallery_submissions select own or admin"
  ON public.event_gallery_submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "event_gallery_submissions insert own" ON public.event_gallery_submissions;
CREATE POLICY "event_gallery_submissions insert own"
  ON public.event_gallery_submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND has_permission_confirmed = true);

DROP POLICY IF EXISTS "event_gallery_submissions admin update" ON public.event_gallery_submissions;
CREATE POLICY "event_gallery_submissions admin update"
  ON public.event_gallery_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Replace legacy permissive gallery SELECT (published event only, no approval gate)
DROP POLICY IF EXISTS "event gallery public read" ON public.event_gallery;
DROP POLICY IF EXISTS "event_gallery public read" ON public.event_gallery;

-- Public gallery reads approved images on published events; admins see all
CREATE POLICY "event gallery public read"
  ON public.event_gallery FOR SELECT TO anon, authenticated
  USING (
    (
      is_public_approved = true
      AND EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_gallery.event_id
          AND e.status = 'published'
          AND e.is_active = true
      )
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- ============================================================
-- PARTICIPANT DEMOGRAPHICS RPC (ownership-validated writes)
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_my_participant_demographics(
  p_source_type public.demographic_source_type,
  p_source_id UUID,
  p_age_range TEXT DEFAULT NULL,
  p_race TEXT DEFAULT NULL,
  p_ethnicity TEXT DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_veteran_status TEXT DEFAULT NULL,
  p_disability_status TEXT DEFAULT NULL,
  p_farmer_producer_status TEXT DEFAULT NULL,
  p_beginning_farmer BOOLEAN DEFAULT NULL,
  p_limited_resource_producer BOOLEAN DEFAULT NULL,
  p_county TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_rural_urban TEXT DEFAULT NULL,
  p_institution_id UUID DEFAULT NULL,
  p_academic_level public.academic_level DEFAULT NULL,
  p_consent_demographics BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_allowed BOOLEAN := false;
  v_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF p_consent_demographics IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'consent_demographics is required';
  END IF;

  IF p_source_type = 'registration' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.event_registrations er
      WHERE er.id = p_source_id AND er.user_id = v_user_id
    ) INTO v_allowed;
  ELSIF p_source_type = 'attendance' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.event_attendance ea
      JOIN public.event_registrations er ON er.id = ea.registration_id
      WHERE ea.id = p_source_id AND er.user_id = v_user_id
    ) INTO v_allowed;
  ELSIF p_source_type = 'evaluation' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.event_evaluation_responses r
      WHERE r.id = p_source_id AND r.user_id = v_user_id
    ) INTO v_allowed;
  ELSE
    RAISE EXCEPTION 'unsupported demographic source for self-service insert';
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'not authorized for demographic source';
  END IF;

  INSERT INTO public.participant_demographics (
    source_type,
    source_id,
    user_id,
    age_range,
    race,
    ethnicity,
    gender,
    veteran_status,
    disability_status,
    farmer_producer_status,
    beginning_farmer,
    limited_resource_producer,
    county,
    state,
    rural_urban,
    institution_id,
    academic_level,
    consent_demographics
  ) VALUES (
    p_source_type,
    p_source_id,
    v_user_id,
    p_age_range,
    p_race,
    p_ethnicity,
    p_gender,
    p_veteran_status,
    p_disability_status,
    p_farmer_producer_status,
    p_beginning_farmer,
    p_limited_resource_producer,
    p_county,
    p_state,
    p_rural_urban,
    p_institution_id,
    p_academic_level,
    true
  )
  ON CONFLICT (source_type, source_id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    age_range = EXCLUDED.age_range,
    race = EXCLUDED.race,
    ethnicity = EXCLUDED.ethnicity,
    gender = EXCLUDED.gender,
    veteran_status = EXCLUDED.veteran_status,
    disability_status = EXCLUDED.disability_status,
    farmer_producer_status = EXCLUDED.farmer_producer_status,
    beginning_farmer = EXCLUDED.beginning_farmer,
    limited_resource_producer = EXCLUDED.limited_resource_producer,
    county = EXCLUDED.county,
    state = EXCLUDED.state,
    rural_urban = EXCLUDED.rural_urban,
    institution_id = EXCLUDED.institution_id,
    academic_level = EXCLUDED.academic_level,
    consent_demographics = EXCLUDED.consent_demographics,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_my_participant_demographics(
  public.demographic_source_type,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  BOOLEAN,
  BOOLEAN,
  TEXT,
  TEXT,
  TEXT,
  UUID,
  public.academic_level,
  BOOLEAN
) TO authenticated;
