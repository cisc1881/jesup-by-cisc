-- Conference meal credentials and protected attendee accommodation requests.

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS dietary_restrictions text,
  ADD COLUMN IF NOT EXISTS food_allergies text,
  ADD COLUMN IF NOT EXISTS accessibility_accommodations text,
  ADD COLUMN IF NOT EXISTS accommodation_consent boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.event_meal_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  label text NOT NULL,
  allowance_per_attendee integer NOT NULL DEFAULT 1 CHECK (allowance_per_attendee BETWEEN 1 AND 10),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, service_date, label)
);

CREATE TABLE IF NOT EXISTS public.event_meal_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_day_id uuid NOT NULL REFERENCES public.event_meal_days(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  redemption_number integer NOT NULL CHECK (redemption_number BETWEEN 1 AND 10),
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  redeemed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (meal_day_id, registration_id, redemption_number)
);

ALTER TABLE public.event_meal_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_meal_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal days admin manage" ON public.event_meal_days
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "meal days attendee read" ON public.event_meal_days
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.event_registrations r
      WHERE r.event_id = event_meal_days.event_id AND r.user_id = auth.uid()
    )
  );
CREATE POLICY "meal redemptions admin manage" ON public.event_meal_redemptions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "meal redemptions attendee read own" ON public.event_meal_redemptions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.event_registrations r
      WHERE r.id = event_meal_redemptions.registration_id AND r.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_meal_days TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_meal_redemptions TO authenticated;
GRANT ALL ON public.event_meal_days, public.event_meal_redemptions TO service_role;

CREATE OR REPLACE FUNCTION public.save_registration_accommodations(
  p_registration_id uuid,
  p_dietary_restrictions text DEFAULT NULL,
  p_food_allergies text DEFAULT NULL,
  p_accessibility_accommodations text DEFAULT NULL,
  p_consent boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.event_registrations
  SET dietary_restrictions = NULLIF(btrim(p_dietary_restrictions), ''),
      food_allergies = NULLIF(btrim(p_food_allergies), ''),
      accessibility_accommodations = NULLIF(btrim(p_accessibility_accommodations), ''),
      accommodation_consent = p_consent,
      updated_at = now()
  WHERE id = p_registration_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Registration not found'; END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.save_registration_accommodations(uuid, text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_registration_accommodations(uuid, text, text, text, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.redeem_event_meal_ticket(p_meal_day_id uuid, p_ticket_code text)
RETURNS TABLE (
  attendee_name text,
  event_title text,
  meal_label text,
  used_count integer,
  allowance integer,
  remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day public.event_meal_days%ROWTYPE;
  v_registration public.event_registrations%ROWTYPE;
  v_name text;
  v_event_title text;
  v_used integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;

  SELECT * INTO v_day FROM public.event_meal_days WHERE id = p_meal_day_id AND is_active FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Meal service is unavailable'; END IF;

  SELECT * INTO v_registration
  FROM public.event_registrations
  WHERE event_id = v_day.event_id
    AND (upper(ticket_code) = upper(btrim(p_ticket_code)) OR external_barcode = btrim(p_ticket_code))
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'No attendee found for this meal credential'; END IF;
  IF v_registration.status = 'cancelled' THEN RAISE EXCEPTION 'This registration was cancelled'; END IF;

  SELECT count(*)::integer INTO v_used
  FROM public.event_meal_redemptions
  WHERE meal_day_id = v_day.id AND registration_id = v_registration.id;
  IF v_used >= v_day.allowance_per_attendee THEN RAISE EXCEPTION 'Meal allowance already fully used'; END IF;

  INSERT INTO public.event_meal_redemptions (meal_day_id, registration_id, redemption_number, redeemed_by)
  VALUES (v_day.id, v_registration.id, v_used + 1, auth.uid());

  SELECT coalesce(p.full_name, r.attendee_name, 'Guest') INTO v_name
  FROM public.event_registrations r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.id = v_registration.id;
  SELECT title INTO v_event_title FROM public.events WHERE id = v_day.event_id;

  RETURN QUERY SELECT v_name, v_event_title, v_day.label, v_used + 1,
    v_day.allowance_per_attendee, v_day.allowance_per_attendee - (v_used + 1);
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_event_meal_ticket(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_event_meal_ticket(uuid, text) TO authenticated;
