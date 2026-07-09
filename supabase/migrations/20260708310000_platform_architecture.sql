-- Phase 3: JESUP Core Platform Architecture
-- Unified CMS, media library, notifications, settings

CREATE TYPE public.media_asset_type AS ENUM (
  'image',
  'video',
  'pdf',
  'magazine_cover',
  'factsheet',
  'audio',
  'logo',
  'document'
);

CREATE TYPE public.notification_channel AS ENUM ('in_app', 'email', 'sms', 'push');
CREATE TYPE public.notification_status AS ENUM ('pending', 'sent', 'failed', 'read');

CREATE TABLE public.media_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  asset_type public.media_asset_type NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  bucket TEXT,
  storage_path TEXT,
  mime_type TEXT,
  file_size BIGINT,
  alt_text TEXT,
  caption TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  module_context TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.content_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.content_tag_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_id UUID NOT NULL REFERENCES public.content_tags(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tag_id, entity_type, entity_id)
);

CREATE TABLE public.platform_settings (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  channel public.notification_channel NOT NULL DEFAULT 'in_app',
  status public.notification_status NOT NULL DEFAULT 'pending',
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_media_assets_type ON public.media_assets(asset_type);
CREATE INDEX idx_media_assets_module ON public.media_assets(module_context);
CREATE INDEX idx_content_tag_links_entity ON public.content_tag_links(entity_type, entity_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, status);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tag_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Public read for active media (future public gallery)
CREATE POLICY "media_assets_public_read" ON public.media_assets
  FOR SELECT USING (is_active = true);

CREATE POLICY "content_tags_public_read" ON public.content_tags
  FOR SELECT USING (true);

CREATE POLICY "content_tag_links_public_read" ON public.content_tag_links
  FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "media_assets_admin_all" ON public.media_assets
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "content_tags_admin_all" ON public.content_tags
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "content_tag_links_admin_all" ON public.content_tag_links
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "platform_settings_admin_all" ON public.platform_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "notifications_admin_all" ON public.notifications
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "notifications_user_read" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_user_update" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT SELECT ON public.content_tags TO anon, authenticated;
GRANT SELECT ON public.content_tag_links TO anon, authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.media_assets TO authenticated;
GRANT ALL ON public.content_tags TO authenticated;
GRANT ALL ON public.content_tag_links TO authenticated;
GRANT ALL ON public.platform_settings TO authenticated;
GRANT ALL ON public.notifications TO authenticated;

-- Default platform settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('organization', '{"name":"Carver Integrative Sustainability Center","institution":"Tuskegee University","tagline":"The Digital Extension Wagon"}'::jsonb),
  ('brand', '{"primaryColor":"#7A0C16","accentColor":"#C4A035"}'::jsonb),
  ('homepage', '{"heroEnabled":true}'::jsonb),
  ('navigation', '{"showDonate":true}'::jsonb),
  ('maps', '{"provider":"google"}'::jsonb),
  ('qualtrics', '{"enabled":false}'::jsonb),
  ('ai', '{"enabled":false,"provider":null}'::jsonb),
  ('email', '{"fromName":"JESUP","fromAddress":null}'::jsonb),
  ('storage', '{"defaultBucket":"media-library"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Media library storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-library', 'media-library', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "media_library_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'media-library');

CREATE POLICY "media_library_admin_write" ON storage.objects
  FOR ALL USING (bucket_id = 'media-library' AND public.has_role(auth.uid(), 'admin'));
