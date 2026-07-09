-- Strategic Partners module: extended partner profile + publication/podcast relations

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS mission TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS partnership_areas TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_partners_published_featured
  ON public.partners (is_published, is_featured, sort_order)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_partners_category
  ON public.partners (category)
  WHERE is_published = true;

CREATE TABLE IF NOT EXISTS public.partner_publications (
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (partner_id, publication_id)
);

CREATE TABLE IF NOT EXISTS public.partner_podcast_episodes (
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  podcast_episode_id UUID NOT NULL REFERENCES public.podcast_episodes(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (partner_id, podcast_episode_id)
);

GRANT SELECT ON public.partner_publications TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_publications TO authenticated;
GRANT ALL ON public.partner_publications TO service_role;

GRANT SELECT ON public.partner_podcast_episodes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_podcast_episodes TO authenticated;
GRANT ALL ON public.partner_podcast_episodes TO service_role;

ALTER TABLE public.partner_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_podcast_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner publications public read"
  ON public.partner_publications FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = partner_id AND (p.is_published = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "partner publications admin write"
  ON public.partner_publications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "partner podcasts public read"
  ON public.partner_podcast_episodes FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = partner_id AND (p.is_published = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "partner podcasts admin write"
  ON public.partner_podcast_episodes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Map legacy category labels to strategic partner taxonomy
UPDATE public.partners SET category = 'University & Extension'
  WHERE category IN ('Extension Partner', 'University Partner');
UPDATE public.partners SET category = 'Federal Government'
  WHERE category IN ('Government Partner');
UPDATE public.partners SET category = 'Research'
  WHERE category = 'Research Partner';
UPDATE public.partners SET category = 'Community Organization'
  WHERE category IN ('Community Partner');
UPDATE public.partners SET category = 'Corporate'
  WHERE category = 'Corporate Partner';
UPDATE public.partners SET category = 'Foundation'
  WHERE category = 'Foundation Partner';
UPDATE public.partners SET category = 'Conservation & Natural Resources'
  WHERE category IN ('Conservation Partner');
