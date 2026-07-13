-- Sprint 10 Phase 3: County emergency management directory
-- Verified county contacts for Weather & Emergency Center preparedness cards.
-- Do not apply to production until reviewed and approved.

CREATE TABLE IF NOT EXISTS public.county_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_name TEXT NOT NULL,
  state_name TEXT NOT NULL,
  state_code CHAR(2) NOT NULL,
  agency_name TEXT NOT NULL,
  primary_phone TEXT,
  alternate_phone TEXT,
  website_url TEXT,
  alert_signup_url TEXT,
  shelter_info_url TEXT,
  weather_radio_guidance TEXT,
  emergency_kit_guidance TEXT,
  household_storm_protocol TEXT,
  source_name TEXT,
  source_url TEXT,
  verified_date DATE,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('verified', 'pending', 'generic')),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT county_emergency_contacts_state_code_upper CHECK (state_code = upper(state_code)),
  CONSTRAINT county_emergency_contacts_verified_phone CHECK (
    verification_status <> 'verified' OR primary_phone IS NOT NULL
  )
);

COMMENT ON TABLE public.county_emergency_contacts IS
  'Verified county emergency-management contacts for JESUP Weather & Emergency Center. Only verified active records are public.';

COMMENT ON COLUMN public.county_emergency_contacts.verification_status IS
  'verified = public-ready with source; pending = admin review; generic should not be stored (use app fallback).';

COMMENT ON COLUMN public.county_emergency_contacts.primary_phone IS
  'Displayed publicly only when verification_status = verified and is_active = true.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_county_emergency_contacts_active_unique
  ON public.county_emergency_contacts (lower(county_name), state_code)
  WHERE archived_at IS NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_county_emergency_contacts_verified_lookup
  ON public.county_emergency_contacts (lower(county_name), state_code, verification_status, is_active)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_county_emergency_contacts_state
  ON public.county_emergency_contacts (state_code, county_name);

GRANT SELECT ON public.county_emergency_contacts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.county_emergency_contacts TO authenticated;
GRANT ALL ON public.county_emergency_contacts TO service_role;

ALTER TABLE public.county_emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "county contacts public read verified active"
  ON public.county_emergency_contacts FOR SELECT TO anon, authenticated
  USING (
    verification_status = 'verified'
    AND is_active = true
    AND archived_at IS NULL
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "county contacts admin write"
  ON public.county_emergency_contacts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER county_emergency_contacts_set_updated_at
  BEFORE UPDATE ON public.county_emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed verified Macon County, Alabama (existing JESUP trusted record)
INSERT INTO public.county_emergency_contacts (
  county_name,
  state_name,
  state_code,
  agency_name,
  primary_phone,
  weather_radio_guidance,
  emergency_kit_guidance,
  household_storm_protocol,
  source_name,
  source_url,
  verified_date,
  verification_status,
  notes,
  is_active
)
SELECT
  'Macon County',
  'Alabama',
  'AL',
  'Macon County Emergency Management Agency',
  '334-724-2626',
  'Keep a NOAA weather radio or reliable local alert app enabled for Macon County.',
  'Prepare a storm emergency kit: water, medications, flashlight, first aid, and important documents.',
  'Agree on a household storm protocol — where to shelter and how to check on neighbors.',
  'Macon County Emergency Management Agency',
  'https://ema.alabama.gov/counties/macon-county/',
  CURRENT_DATE,
  'verified',
  'Seed record for Sprint 10 Phase 3. Review source URL and phone periodically.',
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.county_emergency_contacts
  WHERE lower(county_name) = lower('Macon County')
    AND state_code = 'AL'
    AND archived_at IS NULL
);
