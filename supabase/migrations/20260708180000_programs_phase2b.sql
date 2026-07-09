-- Phase 2B: extend programs CMS with contact info, objectives, grants, and AI-ready metadata.

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS objectives_html TEXT,
  ADD COLUMN IF NOT EXISTS program_director TEXT,
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS registration_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Alias table name used in CMS spec (program_images).
ALTER TABLE public.program_gallery_images RENAME TO program_images;

CREATE TABLE IF NOT EXISTS public.program_grants (
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  grant_id UUID NOT NULL REFERENCES public.grants(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (program_id, grant_id)
);

GRANT SELECT ON public.program_grants TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_grants TO authenticated;
GRANT ALL ON public.program_grants TO service_role;

ALTER TABLE public.program_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "program grants public read"
  ON public.program_grants FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_id AND (p.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "program grants admin write"
  ON public.program_grants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- View alias for podcast junction (spec: program_podcasts).
CREATE OR REPLACE VIEW public.program_podcasts AS
  SELECT program_id, podcast_episode_id, sort_order
  FROM public.program_podcast_episodes;

GRANT SELECT ON public.program_podcasts TO anon, authenticated;
