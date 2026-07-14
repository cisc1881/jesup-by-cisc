-- News & Stories module

CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content_html TEXT,
  author TEXT,
  category TEXT,
  cover_image_url TEXT,
  published_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  reading_time_minutes INT,
  seo_title TEXT,
  seo_description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.news_tags (
  news_article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (news_article_id, tag)
);

CREATE TABLE public.news_programs (
  news_article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (news_article_id, program_id)
);

CREATE TABLE public.news_events (
  news_article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (news_article_id, event_id)
);

CREATE TABLE public.news_publications (
  news_article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (news_article_id, publication_id)
);

CREATE TABLE public.news_partners (
  news_article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (news_article_id, partner_id)
);

CREATE INDEX idx_news_articles_published
  ON public.news_articles (is_published, published_at DESC);

CREATE INDEX idx_news_articles_featured
  ON public.news_articles (is_featured, published_at DESC)
  WHERE is_published = true AND is_featured = true;

GRANT SELECT ON public.news_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_articles TO authenticated;
GRANT ALL ON public.news_articles TO service_role;

GRANT SELECT ON public.news_tags TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_tags TO authenticated;
GRANT ALL ON public.news_tags TO service_role;

GRANT SELECT ON public.news_programs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_programs TO authenticated;
GRANT ALL ON public.news_programs TO service_role;

GRANT SELECT ON public.news_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_events TO authenticated;
GRANT ALL ON public.news_events TO service_role;

GRANT SELECT ON public.news_publications TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_publications TO authenticated;
GRANT ALL ON public.news_publications TO service_role;

GRANT SELECT ON public.news_partners TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_partners TO authenticated;
GRANT ALL ON public.news_partners TO service_role;

ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News articles are viewable when published"
  ON public.news_articles FOR SELECT
  USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage news articles"
  ON public.news_articles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "News tags public read"
  ON public.news_tags FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.news_articles a
      WHERE a.id = news_article_id AND (a.is_published = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "News tags admin write"
  ON public.news_tags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "News programs public read"
  ON public.news_programs FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.news_articles a
      WHERE a.id = news_article_id AND (a.is_published = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "News programs admin write"
  ON public.news_programs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "News events public read"
  ON public.news_events FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.news_articles a
      WHERE a.id = news_article_id AND (a.is_published = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "News events admin write"
  ON public.news_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "News publications public read"
  ON public.news_publications FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.news_articles a
      WHERE a.id = news_article_id AND (a.is_published = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "News publications admin write"
  ON public.news_publications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "News partners public read"
  ON public.news_partners FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.news_articles a
      WHERE a.id = news_article_id AND (a.is_published = true OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "News partners admin write"
  ON public.news_partners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER news_articles_set_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, name = EXCLUDED.name;

CREATE POLICY "news-images public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'news-images');
CREATE POLICY "news-images admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'news-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "news-images admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'news-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "news-images admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'news-images' AND public.has_role(auth.uid(), 'admin'));
