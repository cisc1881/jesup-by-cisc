-- Phase 3B: JESUP Farmers Market Platform

CREATE TYPE public.market_product_category AS ENUM (
  'fruit',
  'vegetables',
  'meat',
  'eggs',
  'dairy',
  'honey',
  'plants',
  'flowers',
  'value_added',
  'prepared_foods',
  'crafts'
);

CREATE TYPE public.market_announcement_type AS ENUM ('general', 'closure', 'weather', 'seasonal');

ALTER TABLE public.markets
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS accepts_snap_ebt BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepts_credit BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parking_info TEXT,
  ADD COLUMN IF NOT EXISTS payment_notes TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE public.market_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  opens_at TIME,
  closes_at TIME,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (market_id, day_of_week)
);

CREATE TABLE public.market_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.market_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  social_url TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  seasonal_availability TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (market_id, slug)
);

CREATE TABLE public.market_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.market_vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category public.market_product_category NOT NULL DEFAULT 'vegetables',
  description TEXT,
  available_today BOOLEAN NOT NULL DEFAULT false,
  season TEXT,
  is_organic BOOLEAN NOT NULL DEFAULT false,
  is_local BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.market_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  announcement_type public.market_announcement_type NOT NULL DEFAULT 'general',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, market_id)
);

CREATE TABLE public.market_events (
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (market_id, event_id)
);

CREATE TABLE public.market_programs (
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (market_id, program_id)
);

UPDATE public.markets
SET slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND name IS NOT NULL;

UPDATE public.markets SET slug = id::text WHERE slug IS NULL;

-- Grants
GRANT SELECT ON public.market_hours TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_hours TO authenticated;
GRANT ALL ON public.market_hours TO service_role;

GRANT SELECT ON public.market_images TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_images TO authenticated;
GRANT ALL ON public.market_images TO service_role;

GRANT SELECT ON public.market_vendors TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_vendors TO authenticated;
GRANT ALL ON public.market_vendors TO service_role;

GRANT SELECT ON public.market_products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_products TO authenticated;
GRANT ALL ON public.market_products TO service_role;

GRANT SELECT ON public.market_announcements TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_announcements TO authenticated;
GRANT ALL ON public.market_announcements TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

GRANT SELECT ON public.market_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_events TO authenticated;
GRANT ALL ON public.market_events TO service_role;

GRANT SELECT ON public.market_programs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_programs TO authenticated;
GRANT ALL ON public.market_programs TO service_role;

-- RLS
ALTER TABLE public.market_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "markets public read" ON public.markets;
CREATE POLICY "markets public read active"
  ON public.markets FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "market hours public read"
  ON public.market_hours FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.markets m
      WHERE m.id = market_id AND (m.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "market hours admin write"
  ON public.market_hours FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "market images public read"
  ON public.market_images FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.markets m
      WHERE m.id = market_id AND (m.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "market images admin write"
  ON public.market_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "market vendors public read"
  ON public.market_vendors FOR SELECT TO anon, authenticated
  USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.markets m
      WHERE m.id = market_id AND (m.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "market vendors admin write"
  ON public.market_vendors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "market products public read"
  ON public.market_products FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.market_vendors v
      JOIN public.markets m ON m.id = v.market_id
      WHERE v.id = vendor_id AND v.is_active = true
        AND (m.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "market products admin write"
  ON public.market_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "market announcements public read"
  ON public.market_announcements FOR SELECT TO anon, authenticated
  USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.markets m
      WHERE m.id = market_id AND (m.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "market announcements admin write"
  ON public.market_announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "favorites select own"
  ON public.favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "favorites insert own"
  ON public.favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites delete own"
  ON public.favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "market events public read"
  ON public.market_events FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.markets m
      WHERE m.id = market_id AND (m.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "market events admin write"
  ON public.market_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "market programs public read"
  ON public.market_programs FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.markets m
      WHERE m.id = market_id AND (m.is_active = true OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY "market programs admin write"
  ON public.market_programs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER market_hours_set_updated_at
  BEFORE UPDATE ON public.market_hours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER market_vendors_set_updated_at
  BEFORE UPDATE ON public.market_vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER market_products_set_updated_at
  BEFORE UPDATE ON public.market_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER market_announcements_set_updated_at
  BEFORE UPDATE ON public.market_announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
