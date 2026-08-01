CREATE TABLE IF NOT EXISTS public.news_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  content_html text,
  author text,
  category text,
  cover_image_url text,
  published_at timestamptz,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  reading_time_minutes integer,
  seo_title text,
  seo_description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.news_articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news_articles TO authenticated;
GRANT ALL ON public.news_articles TO service_role;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published news" ON public.news_articles
  FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can read all news" ON public.news_articles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can write news" ON public.news_articles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update news" ON public.news_articles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete news" ON public.news_articles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.news_tags (
  id uuid primary key default gen_random_uuid(),
  news_article_id uuid not null references public.news_articles(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_news_tags_article ON public.news_tags(news_article_id);

GRANT SELECT ON public.news_tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news_tags TO authenticated;
GRANT ALL ON public.news_tags TO service_role;
ALTER TABLE public.news_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read news tags" ON public.news_tags FOR SELECT USING (true);
CREATE POLICY "Admins can write news tags" ON public.news_tags
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update news tags" ON public.news_tags
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete news tags" ON public.news_tags
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.news_programs (
  id uuid primary key default gen_random_uuid(),
  news_article_id uuid not null references public.news_articles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_news_programs_article ON public.news_programs(news_article_id);

CREATE TABLE IF NOT EXISTS public.news_events (
  id uuid primary key default gen_random_uuid(),
  news_article_id uuid not null references public.news_articles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_news_events_article ON public.news_events(news_article_id);

CREATE TABLE IF NOT EXISTS public.news_publications (
  id uuid primary key default gen_random_uuid(),
  news_article_id uuid not null references public.news_articles(id) on delete cascade,
  publication_id uuid not null references public.publications(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_news_publications_article ON public.news_publications(news_article_id);

CREATE TABLE IF NOT EXISTS public.news_partners (
  id uuid primary key default gen_random_uuid(),
  news_article_id uuid not null references public.news_articles(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_news_partners_article ON public.news_partners(news_article_id);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['news_programs','news_events','news_publications','news_partners']
  LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated;', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "Public can read %1$s" ON public.%1$I FOR SELECT USING (true);', t);
    EXECUTE format('CREATE POLICY "Admins can insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''));', t);
    EXECUTE format('CREATE POLICY "Admins can update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin''));', t);
    EXECUTE format('CREATE POLICY "Admins can delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''));', t);
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.content_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

GRANT SELECT ON public.content_tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content_tags TO authenticated;
GRANT ALL ON public.content_tags TO service_role;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read content tags" ON public.content_tags FOR SELECT USING (true);
CREATE POLICY "Admins can insert content tags" ON public.content_tags
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update content tags" ON public.content_tags
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete content tags" ON public.content_tags
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.content_tag_links (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references public.content_tags(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_content_tag_links_entity ON public.content_tag_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_content_tag_links_tag ON public.content_tag_links(tag_id);

GRANT SELECT ON public.content_tag_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content_tag_links TO authenticated;
GRANT ALL ON public.content_tag_links TO service_role;
ALTER TABLE public.content_tag_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read content tag links" ON public.content_tag_links FOR SELECT USING (true);
CREATE POLICY "Admins can insert content tag links" ON public.content_tag_links
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update content tag links" ON public.content_tag_links
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete content tag links" ON public.content_tag_links
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  asset_type text not null,
  url text not null,
  bucket text,
  storage_path text,
  mime_type text,
  file_size bigint,
  alt_text text,
  caption text,
  metadata jsonb not null default '{}'::jsonb,
  module_context text,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_media_assets_type ON public.media_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_module ON public.media_assets(module_context);

GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active media assets" ON public.media_assets
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can read all media assets" ON public.media_assets
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert media assets" ON public.media_assets
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update media assets" ON public.media_assets
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete media assets" ON public.media_assets
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.home_sections (
  id uuid primary key default gen_random_uuid(),
  section_id text not null unique,
  title text,
  subtitle text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.home_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.home_sections TO authenticated;
GRANT ALL ON public.home_sections TO service_role;
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published home sections" ON public.home_sections
  FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can read all home sections" ON public.home_sections
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert home sections" ON public.home_sections
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update home sections" ON public.home_sections
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete home sections" ON public.home_sections
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read platform settings" ON public.platform_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert platform settings" ON public.platform_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update platform settings" ON public.platform_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete platform settings" ON public.platform_settings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.partner_publications (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  publication_id uuid not null references public.publications(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_partner_publications_partner ON public.partner_publications(partner_id);

CREATE TABLE IF NOT EXISTS public.partner_podcast_episodes (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  podcast_episode_id uuid not null references public.podcast_episodes(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_partner_podcast_episodes_partner ON public.partner_podcast_episodes(partner_id);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['partner_publications','partner_podcast_episodes']
  LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated;', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY "Public can read %1$s" ON public.%1$I FOR SELECT USING (true);', t);
    EXECUTE format('CREATE POLICY "Admins can insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''));', t);
    EXECUTE format('CREATE POLICY "Admins can update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin''));', t);
    EXECUTE format('CREATE POLICY "Admins can delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''));', t);
  END LOOP;
END $$;

ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS mission text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS partnership_areas text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS website_url text;

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS slug text;

ALTER TABLE public.podcast_episodes ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.podcast_episodes ADD COLUMN IF NOT EXISTS guest text;
ALTER TABLE public.podcast_episodes ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.podcast_episodes ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;

ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.publications ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS short text;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.markets ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS requirements_html text;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS is_2fas boolean NOT NULL DEFAULT false;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS is_open boolean NOT NULL DEFAULT true;

ALTER TABLE public.grants ADD COLUMN IF NOT EXISTS funder text;
ALTER TABLE public.grants ADD COLUMN IF NOT EXISTS description text;