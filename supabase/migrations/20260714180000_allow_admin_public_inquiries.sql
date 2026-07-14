-- Allow authenticated administrators to exercise the same public inquiry
-- workflow as other signed-in users. The SECURITY DEFINER function continues
-- to prevent user impersonation and always creates a new, unassigned inquiry.

CREATE OR REPLACE FUNCTION public.submit_public_inquiry(
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_inquiry_type public.inquiry_type,
  p_consent_contact BOOLEAN,
  p_phone TEXT DEFAULT NULL,
  p_preferred_contact public.preferred_contact_method DEFAULT 'either',
  p_organization_or_school TEXT DEFAULT NULL,
  p_institution_id UUID DEFAULT NULL,
  p_institution_type public.institution_type DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_county TEXT DEFAULT NULL,
  p_program_id UUID DEFAULT NULL,
  p_message TEXT DEFAULT NULL,
  p_newsletter_opt_in BOOLEAN DEFAULT false,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_uid UUID := auth.uid();
BEGIN
  IF p_consent_contact IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'consent_contact is required';
  END IF;

  IF trim(COALESCE(p_first_name, '')) = ''
    OR trim(COALESCE(p_last_name, '')) = ''
    OR trim(COALESCE(p_email, '')) = '' THEN
    RAISE EXCEPTION 'first_name, last_name, and email are required';
  END IF;

  IF v_uid IS NULL THEN
    IF p_user_id IS NOT NULL THEN
      RAISE EXCEPTION 'anonymous inquiries cannot set user_id';
    END IF;
  ELSIF p_user_id IS NOT NULL AND p_user_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'cannot set user_id for another user';
  END IF;

  INSERT INTO public.inquiries (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    preferred_contact,
    organization_or_school,
    institution_id,
    institution_type,
    city,
    state,
    county,
    inquiry_type,
    program_id,
    message,
    consent_contact,
    newsletter_opt_in,
    status,
    assigned_to
  ) VALUES (
    CASE WHEN v_uid IS NULL THEN NULL ELSE COALESCE(p_user_id, v_uid) END,
    trim(p_first_name),
    trim(p_last_name),
    trim(lower(p_email)),
    NULLIF(trim(COALESCE(p_phone, '')), ''),
    COALESCE(p_preferred_contact, 'either'::public.preferred_contact_method),
    NULLIF(trim(COALESCE(p_organization_or_school, '')), ''),
    p_institution_id,
    p_institution_type,
    NULLIF(trim(COALESCE(p_city, '')), ''),
    NULLIF(trim(COALESCE(p_state, '')), ''),
    NULLIF(trim(COALESCE(p_county, '')), ''),
    p_inquiry_type,
    p_program_id,
    NULLIF(trim(COALESCE(p_message, '')), ''),
    true,
    COALESCE(p_newsletter_opt_in, false),
    'new'::public.inquiry_status,
    NULL
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_public_inquiry(
  TEXT, TEXT, TEXT, public.inquiry_type, BOOLEAN,
  TEXT, public.preferred_contact_method, TEXT, UUID, public.institution_type,
  TEXT, TEXT, TEXT, UUID, TEXT, BOOLEAN, UUID
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_public_inquiry(
  TEXT, TEXT, TEXT, public.inquiry_type, BOOLEAN,
  TEXT, public.preferred_contact_method, TEXT, UUID, public.institution_type,
  TEXT, TEXT, TEXT, UUID, TEXT, BOOLEAN, UUID
) TO anon, authenticated;
