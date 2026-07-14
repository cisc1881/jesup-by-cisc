-- Phase 4A.1: 2FAS (Future Farmers and Agricultural Specialists) foundation

CREATE TYPE public.twofas_track AS ENUM (
  'high_school',
  'undergraduate',
  'graduate',
  'fellow'
);

CREATE TYPE public.milestone_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'waived'
);

CREATE TYPE public.twofas_document_type AS ENUM (
  'resume',
  'transcript',
  'portfolio',
  'other'
);

-- Extend application pipeline statuses (keep existing pending/reviewed/accepted/rejected)
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'waitlisted';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'withdrawn';

CREATE TABLE public.twofas_cohorts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  track public.twofas_track NOT NULL,
  year INT NOT NULL,
  description TEXT,
  starts_on DATE,
  ends_on DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.twofas_cohort_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cohort_id UUID NOT NULL REFERENCES public.twofas_cohorts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_offset_days INT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.internships
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS track public.twofas_track,
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES public.twofas_cohorts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_2fas BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requirements_html TEXT,
  ADD COLUMN IF NOT EXISTS max_applicants INT;

ALTER TABLE public.internship_applications
  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES public.twofas_cohorts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS track public.twofas_track,
  ADD COLUMN IF NOT EXISTS school_name TEXT,
  ADD COLUMN IF NOT EXISTS major TEXT,
  ADD COLUMN IF NOT EXISTS graduation_year INT,
  ADD COLUMN IF NOT EXISTS emergency_contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.internships
SET slug = lower(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND title IS NOT NULL;

UPDATE public.internships SET slug = id::text WHERE slug IS NULL;

CREATE TABLE public.twofas_mentors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  bio TEXT,
  expertise TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.twofas_mentor_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL UNIQUE REFERENCES public.internship_applications(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.twofas_mentors(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.twofas_student_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.internship_applications(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES public.twofas_cohort_milestones(id) ON DELETE CASCADE,
  status public.milestone_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (application_id, milestone_id)
);

CREATE TABLE public.twofas_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.internship_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type public.twofas_document_type NOT NULL DEFAULT 'other',
  file_path TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants
GRANT SELECT ON public.twofas_cohorts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.twofas_cohorts TO authenticated;
GRANT ALL ON public.twofas_cohorts TO service_role;

GRANT SELECT ON public.twofas_cohort_milestones TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.twofas_cohort_milestones TO authenticated;
GRANT ALL ON public.twofas_cohort_milestones TO service_role;

GRANT SELECT ON public.twofas_mentors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.twofas_mentors TO authenticated;
GRANT ALL ON public.twofas_mentors TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.twofas_mentor_assignments TO authenticated;
GRANT ALL ON public.twofas_mentor_assignments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.twofas_student_milestones TO authenticated;
GRANT ALL ON public.twofas_student_milestones TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.twofas_documents TO authenticated;
GRANT ALL ON public.twofas_documents TO service_role;

-- RLS
ALTER TABLE public.twofas_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twofas_cohort_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twofas_mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twofas_mentor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twofas_student_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.twofas_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "twofas cohorts public read active"
  ON public.twofas_cohorts FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "twofas cohorts admin write"
  ON public.twofas_cohorts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "twofas cohort milestones public read"
  ON public.twofas_cohort_milestones FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.twofas_cohorts c
      WHERE c.id = cohort_id AND (c.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "twofas cohort milestones admin write"
  ON public.twofas_cohort_milestones FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "twofas mentors authenticated read active"
  ON public.twofas_mentors FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "twofas mentors admin write"
  ON public.twofas_mentors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "twofas mentor assignments select own or admin"
  ON public.twofas_mentor_assignments FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.internship_applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "twofas mentor assignments admin write"
  ON public.twofas_mentor_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "twofas student milestones select own or admin"
  ON public.twofas_student_milestones FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.internship_applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "twofas student milestones update own or admin"
  ON public.twofas_student_milestones FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.internship_applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.internship_applications a
      WHERE a.id = application_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "twofas student milestones admin insert delete"
  ON public.twofas_student_milestones FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "twofas student milestones admin delete"
  ON public.twofas_student_milestones FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "twofas documents select own or admin"
  ON public.twofas_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "twofas documents insert own"
  ON public.twofas_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "twofas documents delete own or admin"
  ON public.twofas_documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Students may update own applications while still pending
DROP POLICY IF EXISTS "apps update own pending" ON public.internship_applications;
CREATE POLICY "apps update own pending"
  ON public.internship_applications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Storage: twofas-documents (private, user-scoped paths)
INSERT INTO storage.buckets (id, name, public)
VALUES ('twofas-documents', 'twofas-documents', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, name = EXCLUDED.name;

DROP POLICY IF EXISTS "twofas-documents user read own" ON storage.objects;
CREATE POLICY "twofas-documents user read own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'twofas-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

DROP POLICY IF EXISTS "twofas-documents user upload own" ON storage.objects;
CREATE POLICY "twofas-documents user upload own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'twofas-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "twofas-documents user update own" ON storage.objects;
CREATE POLICY "twofas-documents user update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'twofas-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  )
  WITH CHECK (
    bucket_id = 'twofas-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

DROP POLICY IF EXISTS "twofas-documents user delete own" ON storage.objects;
CREATE POLICY "twofas-documents user delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'twofas-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE TRIGGER twofas_cohorts_set_updated_at
  BEFORE UPDATE ON public.twofas_cohorts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER twofas_cohort_milestones_set_updated_at
  BEFORE UPDATE ON public.twofas_cohort_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER twofas_mentors_set_updated_at
  BEFORE UPDATE ON public.twofas_mentors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER twofas_mentor_assignments_set_updated_at
  BEFORE UPDATE ON public.twofas_mentor_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER twofas_student_milestones_set_updated_at
  BEFORE UPDATE ON public.twofas_student_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
