-- Programs management: categories, programs, gallery, and content attachments.

CREATE TABLE public.program_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short TEXT,
  tagline TEXT,
  description_html TEXT,
  cover_image_url TEXT,
  category_id UUID REFERENCES public.program_categories(id) ON DELETE SET NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.program_gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.program_publications (
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (program_id, publication_id)
);

CREATE TABLE public.program_podcast_episodes (
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  podcast_episode_id UUID NOT NULL REFERENCES public.podcast_episodes(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (program_id, podcast_episode_id)
);

CREATE TABLE public.program_events (
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (program_id, event_id)
);

CREATE TABLE public.program_partners (
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (program_id, partner_id)
);

-- Grants
GRANT SELECT ON public.program_categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_categories TO authenticated;
GRANT ALL ON public.program_categories TO service_role;

GRANT SELECT ON public.programs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programs TO authenticated;
GRANT ALL ON public.programs TO service_role;

GRANT SELECT ON public.program_gallery_images TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_gallery_images TO authenticated;
GRANT ALL ON public.program_gallery_images TO service_role;

GRANT SELECT ON public.program_publications TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_publications TO authenticated;
GRANT ALL ON public.program_publications TO service_role;

GRANT SELECT ON public.program_podcast_episodes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_podcast_episodes TO authenticated;
GRANT ALL ON public.program_podcast_episodes TO service_role;

GRANT SELECT ON public.program_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_events TO authenticated;
GRANT ALL ON public.program_events TO service_role;

GRANT SELECT ON public.program_partners TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_partners TO authenticated;
GRANT ALL ON public.program_partners TO service_role;

-- RLS
ALTER TABLE public.program_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_podcast_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "program categories public read"
  ON public.program_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "program categories admin write"
  ON public.program_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "programs public read active"
  ON public.programs FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "programs admin write"
  ON public.programs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "program gallery public read"
  ON public.program_gallery_images FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_id AND (p.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "program gallery admin write"
  ON public.program_gallery_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "program publications public read"
  ON public.program_publications FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_id AND (p.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "program publications admin write"
  ON public.program_publications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "program podcast public read"
  ON public.program_podcast_episodes FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_id AND (p.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "program podcast admin write"
  ON public.program_podcast_episodes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "program events public read"
  ON public.program_events FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_id AND (p.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "program events admin write"
  ON public.program_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "program partners public read"
  ON public.program_partners FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.programs p
      WHERE p.id = program_id AND (p.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "program partners admin write"
  ON public.program_partners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated-at triggers
CREATE TRIGGER program_categories_set_updated_at
  BEFORE UPDATE ON public.program_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER programs_set_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for program cover + gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('program-images', 'program-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, name = EXCLUDED.name;

CREATE POLICY "program-images public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'program-images');
CREATE POLICY "program-images admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'program-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "program-images admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'program-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "program-images admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'program-images' AND public.has_role(auth.uid(), 'admin'));
