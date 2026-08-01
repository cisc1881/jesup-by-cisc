CREATE TABLE IF NOT EXISTS public.email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.email_deliveries TO service_role;
GRANT SELECT, UPDATE ON public.email_deliveries TO authenticated;

ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email deliveries admin select" ON public.email_deliveries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "email deliveries admin update" ON public.email_deliveries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.event_meal_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  label text NOT NULL,
  allowance_per_attendee integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.event_meal_days TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_meal_days TO authenticated;

ALTER TABLE public.event_meal_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal days admin all" ON public.event_meal_days FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "meal days select registered" ON public.event_meal_days FOR SELECT TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.event_registrations er
      WHERE er.event_id = event_meal_days.event_id AND er.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.event_meal_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_day_id uuid NOT NULL REFERENCES public.event_meal_days(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  redemption_number integer NOT NULL,
  redeemed_by uuid,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meal_day_id, registration_id, redemption_number)
);

GRANT ALL ON public.event_meal_redemptions TO service_role;
GRANT SELECT, INSERT ON public.event_meal_redemptions TO authenticated;

ALTER TABLE public.event_meal_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal redemptions admin all" ON public.event_meal_redemptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "meal redemptions select own" ON public.event_meal_redemptions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.event_registrations er
      WHERE er.id = event_meal_redemptions.registration_id AND er.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  device_label text,
  is_active boolean NOT NULL DEFAULT true,
  failure_count integer NOT NULL DEFAULT 0,
  last_success_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (endpoint)
);

GRANT ALL ON public.push_subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push subs select own or admin" ON public.push_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "push subs insert own" ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "push subs update own or admin" ON public.push_subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "push subs delete own or admin" ON public.push_subscriptions FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.county_emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  county_name text NOT NULL,
  state_name text NOT NULL,
  state_code text NOT NULL,
  agency_name text NOT NULL,
  primary_phone text,
  alternate_phone text,
  website_url text,
  alert_signup_url text,
  shelter_info_url text,
  weather_radio_guidance text,
  emergency_kit_guidance text,
  household_storm_protocol text,
  source_name text,
  source_url text,
  verified_date date,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('verified','pending','generic')),
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.county_emergency_contacts TO service_role;
GRANT SELECT ON public.county_emergency_contacts TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.county_emergency_contacts TO authenticated;

ALTER TABLE public.county_emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "county contacts public read verified" ON public.county_emergency_contacts FOR SELECT TO anon, authenticated
  USING (
    (verification_status = 'verified' AND is_active = true AND archived_at IS NULL)
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "county contacts admin write" ON public.county_emergency_contacts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.processed_weather_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nws_alert_id text NOT NULL,
  severity text NOT NULL,
  event_name text NOT NULL,
  sent_at timestamptz,
  expires_at timestamptz NOT NULL,
  delivery_status text NOT NULL CHECK (delivery_status IN ('pending','sent','suppressed','failed','test','expired')),
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, nws_alert_id)
);

GRANT ALL ON public.processed_weather_alerts TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.processed_weather_alerts TO authenticated;

ALTER TABLE public.processed_weather_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "processed alerts select own or admin" ON public.processed_weather_alerts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "processed alerts insert own or admin" ON public.processed_weather_alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "processed alerts update admin" ON public.processed_weather_alerts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.weather_alert_delayed_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nws_alert_id text NOT NULL,
  severity text NOT NULL,
  event_name text NOT NULL,
  expires_at timestamptz NOT NULL,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','expired','failed','suppressed')),
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, nws_alert_id)
);

GRANT ALL ON public.weather_alert_delayed_deliveries TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.weather_alert_delayed_deliveries TO authenticated;

ALTER TABLE public.weather_alert_delayed_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delayed deliveries select own or admin" ON public.weather_alert_delayed_deliveries FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "delayed deliveries admin write" ON public.weather_alert_delayed_deliveries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.weather_alert_poll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  trigger_source text,
  triggered_by uuid,
  groups_polled integer NOT NULL DEFAULT 0,
  alerts_fetched integer NOT NULL DEFAULT 0,
  deliveries_sent integer NOT NULL DEFAULT 0,
  deliveries_delayed integer NOT NULL DEFAULT 0,
  deliveries_suppressed integer NOT NULL DEFAULT 0,
  deliveries_failed integer NOT NULL DEFAULT 0,
  error_message text
);

GRANT ALL ON public.weather_alert_poll_runs TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.weather_alert_poll_runs TO authenticated;

ALTER TABLE public.weather_alert_poll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "poll runs admin all" ON public.weather_alert_poll_runs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.weather_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  alerts_enabled boolean NOT NULL DEFAULT true,
  watches_enabled boolean NOT NULL DEFAULT true,
  warnings_enabled boolean NOT NULL DEFAULT true,
  emergencies_enabled boolean NOT NULL DEFAULT true,
  daily_forecast_enabled boolean NOT NULL DEFAULT false,
  location_source text CHECK (location_source IN ('live','manual','default','profile')),
  county_name text,
  state_code text,
  latitude_bucket numeric,
  longitude_bucket numeric,
  quiet_hours_enabled boolean NOT NULL DEFAULT false,
  quiet_hours_start text DEFAULT '22:00',
  quiet_hours_end text DEFAULT '07:00',
  timezone text NOT NULL DEFAULT 'America/Chicago',
  last_alert_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT ALL ON public.weather_notification_preferences TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.weather_notification_preferences TO authenticated;

ALTER TABLE public.weather_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weather prefs select own or admin" ON public.weather_notification_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "weather prefs insert own" ON public.weather_notification_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weather prefs update own or admin" ON public.weather_notification_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.redeem_event_meal_ticket(uuid, text);
CREATE OR REPLACE FUNCTION public.redeem_event_meal_ticket(
  p_meal_day_id uuid,
  p_ticket_code text
)
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
  v_meal_day public.event_meal_days%ROWTYPE;
  v_registration public.event_registrations%ROWTYPE;
  v_event public.events%ROWTYPE;
  v_used_count integer;
  v_attendee_name text;
BEGIN
  SELECT * INTO v_meal_day FROM public.event_meal_days WHERE id = p_meal_day_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Meal service not found or inactive.';
  END IF;

  SELECT * INTO v_registration
  FROM public.event_registrations
  WHERE event_id = v_meal_day.event_id
    AND upper(ticket_code) = upper(p_ticket_code);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket code not recognized for this event.';
  END IF;

  SELECT * INTO v_event FROM public.events WHERE id = v_meal_day.event_id;

  SELECT COUNT(*) INTO v_used_count
  FROM public.event_meal_redemptions
  WHERE meal_day_id = p_meal_day_id AND registration_id = v_registration.id;

  IF v_used_count >= v_meal_day.allowance_per_attendee THEN
    RAISE EXCEPTION 'Meal allowance already used for this attendee.';
  END IF;

  INSERT INTO public.event_meal_redemptions (meal_day_id, registration_id, redemption_number, redeemed_by)
  VALUES (p_meal_day_id, v_registration.id, v_used_count + 1, auth.uid());

  v_attendee_name := COALESCE(
    v_registration.attendee_name,
    (SELECT full_name FROM public.profiles WHERE id = v_registration.user_id),
    'Attendee'
  );

  RETURN QUERY SELECT
    v_attendee_name,
    v_event.title,
    v_meal_day.label,
    v_used_count + 1,
    v_meal_day.allowance_per_attendee,
    v_meal_day.allowance_per_attendee - (v_used_count + 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_event_meal_ticket(uuid, text) TO authenticated;