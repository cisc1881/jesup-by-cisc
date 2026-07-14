-- Phase 3A: JESUP Events Platform — categories, rich content, registration, check-in, surveys.

CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.event_registration_status AS ENUM (
  'open',
  'closed',
  'waiting_list',
  'sold_out',
  'invite_only'
);
CREATE TYPE public.event_registration_record_status AS ENUM (
  'registered',
  'waiting_list',
  'cancelled'
);

CREATE TABLE public.event_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.event_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description_html TEXT,
  ADD COLUMN IF NOT EXISTS location_address TEXT,
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Chicago',
  ADD COLUMN IF NOT EXISTS status public.event_status NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_status public.event_registration_status NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS invite_code TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE public.event_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  location TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.event_speakers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  photo_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.event_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.event_partners (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  sponsorship_level TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (event_id, partner_id)
);

CREATE TABLE public.event_podcast_episodes (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  podcast_episode_id UUID NOT NULL REFERENCES public.podcast_episodes(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (event_id, podcast_episode_id)
);

CREATE TABLE public.event_grants (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  grant_id UUID NOT NULL REFERENCES public.grants(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (event_id, grant_id)
);

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS status public.event_registration_record_status NOT NULL DEFAULT 'registered',
  ADD COLUMN IF NOT EXISTS ticket_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE public.event_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_in_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  method TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.event_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Post-event survey',
  qualtrics_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.event_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL UNIQUE REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  certificate_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill slugs and registration status for existing rows.
UPDATE public.events
SET slug = lower(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND title IS NOT NULL;

UPDATE public.events SET slug = id::text WHERE slug IS NULL;

UPDATE public.events
SET registration_status = CASE WHEN registration_open THEN 'open'::public.event_registration_status ELSE 'closed'::public.event_registration_status END
WHERE registration_status IS NULL OR registration_status = 'open' AND registration_open = false;

UPDATE public.event_registrations SET status = 'registered' WHERE status IS NULL;

-- Grants
GRANT SELECT ON public.event_categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_categories TO authenticated;
GRANT ALL ON public.event_categories TO service_role;

GRANT SELECT ON public.event_sessions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_sessions TO authenticated;
GRANT ALL ON public.event_sessions TO service_role;

GRANT SELECT ON public.event_speakers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_speakers TO authenticated;
GRANT ALL ON public.event_speakers TO service_role;

GRANT SELECT ON public.event_gallery TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_gallery TO authenticated;
GRANT ALL ON public.event_gallery TO service_role;

GRANT SELECT ON public.event_partners TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_partners TO authenticated;
GRANT ALL ON public.event_partners TO service_role;

GRANT SELECT ON public.event_podcast_episodes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_podcast_episodes TO authenticated;
GRANT ALL ON public.event_podcast_episodes TO service_role;

GRANT SELECT ON public.event_grants TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_grants TO authenticated;
GRANT ALL ON public.event_grants TO service_role;

GRANT SELECT ON public.event_checkins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_checkins TO authenticated;
GRANT ALL ON public.event_checkins TO service_role;

GRANT SELECT ON public.event_surveys TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_surveys TO authenticated;
GRANT ALL ON public.event_surveys TO service_role;

GRANT SELECT ON public.event_certificates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_certificates TO authenticated;
GRANT ALL ON public.event_certificates TO service_role;

-- RLS
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_podcast_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events public read" ON public.events;
CREATE POLICY "events public read published"
  ON public.events FOR SELECT TO anon, authenticated
  USING (
    (status = 'published' AND is_active = true)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "event categories public read"
  ON public.event_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "event categories admin write"
  ON public.event_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "event sessions public read"
  ON public.event_sessions FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND ((e.status = 'published' AND e.is_active = true) OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "event sessions admin write"
  ON public.event_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "event speakers public read"
  ON public.event_speakers FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND ((e.status = 'published' AND e.is_active = true) OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "event speakers admin write"
  ON public.event_speakers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "event gallery public read"
  ON public.event_gallery FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND ((e.status = 'published' AND e.is_active = true) OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "event gallery admin write"
  ON public.event_gallery FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "event partners public read"
  ON public.event_partners FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND ((e.status = 'published' AND e.is_active = true) OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "event partners admin write"
  ON public.event_partners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "event podcast public read"
  ON public.event_podcast_episodes FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND ((e.status = 'published' AND e.is_active = true) OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "event podcast admin write"
  ON public.event_podcast_episodes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "event grants public read"
  ON public.event_grants FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND ((e.status = 'published' AND e.is_active = true) OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "event grants admin write"
  ON public.event_grants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "event checkins select own or admin"
  ON public.event_checkins FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.event_registrations r
      WHERE r.id = registration_id AND r.user_id = auth.uid()
    )
  );
CREATE POLICY "event checkins admin write"
  ON public.event_checkins FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "event surveys public read"
  ON public.event_surveys FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND ((e.status = 'published' AND e.is_active = true) OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "event surveys admin write"
  ON public.event_surveys FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "event certificates select own or admin"
  ON public.event_certificates FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.event_registrations r
      WHERE r.id = registration_id AND r.user_id = auth.uid()
    )
  );
CREATE POLICY "event certificates admin write"
  ON public.event_certificates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER event_categories_set_updated_at
  BEFORE UPDATE ON public.event_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER event_sessions_set_updated_at
  BEFORE UPDATE ON public.event_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER event_speakers_set_updated_at
  BEFORE UPDATE ON public.event_speakers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER event_registrations_set_updated_at
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER event_surveys_set_updated_at
  BEFORE UPDATE ON public.event_surveys
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ticket code on registration
CREATE OR REPLACE FUNCTION public.generate_event_ticket_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_code IS NULL THEN
    NEW.ticket_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_event_ticket_code
  BEFORE INSERT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.generate_event_ticket_code();

-- Capacity: allow waiting list when registration_status = waiting_list
CREATE OR REPLACE FUNCTION public.enforce_event_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap int;
  reg_count bigint;
  evt_status public.event_registration_status;
BEGIN
  SELECT capacity, registration_status INTO cap, evt_status FROM public.events WHERE id = NEW.event_id;

  IF evt_status = 'invite_only' THEN
    RAISE EXCEPTION 'Registration is invite only';
  END IF;

  IF evt_status IN ('closed', 'sold_out') THEN
    RAISE EXCEPTION 'Registration is closed';
  END IF;

  IF cap IS NULL THEN
    NEW.status := COALESCE(NEW.status, 'registered');
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO reg_count
  FROM public.event_registrations
  WHERE event_id = NEW.event_id AND status = 'registered';

  IF reg_count >= cap THEN
    IF evt_status = 'waiting_list' THEN
      NEW.status := 'waiting_list';
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Event is at capacity';
  END IF;

  NEW.status := 'registered';
  RETURN NEW;
END;
$$;

-- Registration count includes only confirmed registrations
CREATE OR REPLACE FUNCTION public.get_event_registration_count(p_event_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.event_registrations
  WHERE event_id = p_event_id
    AND status = 'registered'
    AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = p_event_id);
$$;

GRANT EXECUTE ON FUNCTION public.get_event_registration_count(uuid) TO anon, authenticated;
