-- Phase 2C: Publications CMS — categories, content types, tags, relationships.

CREATE TYPE public.publication_content_type AS ENUM (
  'factsheet',
  'report',
  'magazine',
  'newsletter',
  'video',
  'external_link',
  'research_publication',
  'extension_bulletin'
);

CREATE TABLE public.publication_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS author TEXT,
  ADD COLUMN IF NOT EXISTS content_type public.publication_content_type,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.publication_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE public.publication_tags (
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (publication_id, tag)
);

CREATE TABLE public.publication_events (
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (publication_id, event_id)
);

CREATE TABLE public.publication_podcast_episodes (
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  podcast_episode_id UUID NOT NULL REFERENCES public.podcast_episodes(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (publication_id, podcast_episode_id)
);

-- Spec alias for program ↔ publication links (canonical: program_publications).
CREATE OR REPLACE VIEW public.publication_programs AS
  SELECT publication_id, program_id, sort_order
  FROM public.program_publications;

GRANT SELECT ON public.publication_categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publication_categories TO authenticated;
GRANT ALL ON public.publication_categories TO service_role;

GRANT SELECT ON public.publication_tags TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publication_tags TO authenticated;
GRANT ALL ON public.publication_tags TO service_role;

GRANT SELECT ON public.publication_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publication_events TO authenticated;
GRANT ALL ON public.publication_events TO service_role;

GRANT SELECT ON public.publication_podcast_episodes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publication_podcast_episodes TO authenticated;
GRANT ALL ON public.publication_podcast_episodes TO service_role;

GRANT SELECT ON public.publication_programs TO anon, authenticated;

ALTER TABLE public.publication_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_podcast_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publication categories public read"
  ON public.publication_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "publication categories admin write"
  ON public.publication_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "pubs public read" ON public.publications;
CREATE POLICY "publications public read active"
  ON public.publications FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "publication tags public read"
  ON public.publication_tags FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.publications p
      WHERE p.id = publication_id AND (p.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "publication tags admin write"
  ON public.publication_tags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "publication events public read"
  ON public.publication_events FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.publications p
      WHERE p.id = publication_id AND (p.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "publication events admin write"
  ON public.publication_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "publication podcast public read"
  ON public.publication_podcast_episodes FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.publications p
      WHERE p.id = publication_id AND (p.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "publication podcast admin write"
  ON public.publication_podcast_episodes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER publication_categories_set_updated_at
  BEFORE UPDATE ON public.publication_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('publication-images', 'publication-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, name = EXCLUDED.name;

CREATE POLICY "publication-images public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'publication-images');
CREATE POLICY "publication-images admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'publication-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "publication-images admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'publication-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "publication-images admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'publication-images' AND public.has_role(auth.uid(), 'admin'));

-- Backfill slugs for existing rows.
UPDATE public.publications
SET slug = lower(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

UPDATE public.publications
SET slug = left(id::text, 8) || '-' || slug
WHERE id IN (
  SELECT p.id FROM public.publications p
  JOIN public.publications p2 ON p.slug = p2.slug AND p.id <> p2.id
);
