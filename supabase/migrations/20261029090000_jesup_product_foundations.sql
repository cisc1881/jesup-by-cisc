-- Jesup product foundations. Existing event ticket codes remain the source of truth
-- for registration and meal redemption; these tables add scoped entitlements.

-- Preserve FC135 planning records for organizers without presenting them as a
-- confirmed public agenda. Editors can publish each session once verified.
ALTER TABLE public.event_sessions ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;
UPDATE public.event_sessions SET is_public = false
  WHERE event_id = '4a1ae1f9-65ff-45ca-98cb-dd8ea2d41a18'::uuid
    AND created_at = '2026-10-22 10:23:23.118285+00'::timestamptz;
DROP POLICY IF EXISTS "event sessions public read" ON public.event_sessions;
CREATE POLICY "event sessions public read" ON public.event_sessions FOR SELECT TO anon, authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (is_public AND EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_id AND e.status = 'published' AND e.is_active = true
  )));

CREATE TABLE public.jesup_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('farmer','student','researcher','educator','specialist','organizer','partner','other')),
  institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  interests text[] NOT NULL DEFAULT '{}',
  county_name text,
  state_code text,
  onboarding_completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jesup_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "preferences own read" ON public.jesup_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "preferences own insert" ON public.jesup_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "preferences own update" ON public.jesup_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE ON public.jesup_preferences TO authenticated;
GRANT ALL ON public.jesup_preferences TO service_role;

CREATE TABLE public.event_map_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  label text NOT NULL,
  category text NOT NULL CHECK (category IN ('parking','building','food','registration','restroom','ada_entrance','exhibitor','emergency','shuttle','first_aid','session','other')),
  description text,
  latitude double precision,
  longitude double precision,
  building text,
  floor_label text,
  indoor_reference text,
  sort_order integer NOT NULL DEFAULT 0,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_map_points_event_idx ON public.event_map_points(event_id, category, sort_order);
ALTER TABLE public.event_map_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "map points published read" ON public.event_map_points FOR SELECT TO anon, authenticated
  USING (is_public AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.status = 'published' AND e.is_active = true) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "map points admin write" ON public.event_map_points FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.event_map_points TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.event_map_points TO authenticated;
GRANT ALL ON public.event_map_points TO service_role;

CREATE TABLE public.jesup_wallet_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('event_ticket','meal','parking','certificate','badge','membership','voucher','vip','donor')),
  title text NOT NULL,
  subtitle text,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','used','expired','revoked')),
  valid_from timestamptz,
  valid_until timestamptz,
  uses_allowed integer CHECK (uses_allowed IS NULL OR uses_allowed > 0),
  apple_pass_id text,
  google_pass_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  issued_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX jesup_wallet_passes_user_idx ON public.jesup_wallet_passes(user_id, status, issued_at DESC);
CREATE INDEX jesup_wallet_passes_event_idx ON public.jesup_wallet_passes(event_id, kind);
CREATE OR REPLACE FUNCTION public.validate_jesup_wallet_pass()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_registration public.event_registrations%ROWTYPE;
BEGIN
  IF NEW.registration_id IS NOT NULL THEN
    SELECT * INTO v_registration FROM public.event_registrations WHERE id = NEW.registration_id;
    IF NOT FOUND OR v_registration.user_id IS DISTINCT FROM NEW.user_id
      OR v_registration.event_id IS DISTINCT FROM NEW.event_id THEN
      RAISE EXCEPTION 'Wallet pass must match the registration owner and event';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER jesup_wallet_pass_validate BEFORE INSERT OR UPDATE OF user_id, event_id, registration_id
  ON public.jesup_wallet_passes FOR EACH ROW EXECUTE FUNCTION public.validate_jesup_wallet_pass();
ALTER TABLE public.jesup_wallet_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet own read" ON public.jesup_wallet_passes FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "wallet admin write" ON public.jesup_wallet_passes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jesup_wallet_passes TO authenticated;
GRANT ALL ON public.jesup_wallet_passes TO service_role;

CREATE TABLE public.event_scan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  pass_id uuid REFERENCES public.jesup_wallet_passes(id) ON DELETE SET NULL,
  purpose text NOT NULL CHECK (purpose IN ('entry','session','meal','parking','contact','exhibitor','workshop','certificate','vip','badge_print')),
  target_id uuid,
  scanned_by uuid NOT NULL REFERENCES auth.users(id),
  scanned_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX event_scan_events_event_idx ON public.event_scan_events(event_id, purpose, scanned_at DESC);
CREATE UNIQUE INDEX event_scan_once_idx ON public.event_scan_events(registration_id, purpose, COALESCE(target_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE purpose IN ('entry','parking','session','workshop','certificate','vip','badge_print');
ALTER TABLE public.event_scan_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scan own or admin read" ON public.event_scan_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.event_registrations r WHERE r.id = registration_id AND r.user_id = auth.uid()));
GRANT SELECT ON public.event_scan_events TO authenticated;
GRANT ALL ON public.event_scan_events TO service_role;

CREATE OR REPLACE FUNCTION public.scan_jesup_credential(p_event_id uuid, p_code text, p_purpose text, p_target_id uuid DEFAULT NULL)
RETURNS TABLE(registration_id uuid, attendee_name text, scan_id uuid, scanned_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_registration public.event_registrations%ROWTYPE;
  v_pass public.jesup_wallet_passes%ROWTYPE;
  v_scan public.event_scan_events%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Organizer permission required'; END IF;
  IF p_purpose NOT IN ('entry','session','meal','parking','contact','exhibitor','workshop','certificate','vip','badge_print') THEN
    RAISE EXCEPTION 'Unsupported scan purpose';
  END IF;
  IF p_purpose = 'meal' THEN RAISE EXCEPTION 'Use meal redemption to validate allowances'; END IF;
  IF p_purpose IN ('session','workshop') AND (p_target_id IS NULL OR NOT EXISTS
    (SELECT 1 FROM public.event_sessions s WHERE s.id = p_target_id AND s.event_id = p_event_id)) THEN
    RAISE EXCEPTION 'A session in this event is required';
  END IF;
  SELECT * INTO v_registration FROM public.event_registrations r
    WHERE r.event_id = p_event_id
      AND (upper(r.ticket_code) = upper(btrim(p_code)) OR r.external_barcode = btrim(p_code))
      AND r.status = 'registered' FOR UPDATE;
  IF NOT FOUND THEN
    SELECT * INTO v_pass FROM public.jesup_wallet_passes w
      WHERE w.event_id = p_event_id AND w.token = trim(p_code) AND w.status = 'active'
        AND (w.valid_from IS NULL OR w.valid_from <= now())
        AND (w.valid_until IS NULL OR w.valid_until >= now());
    IF FOUND THEN
      IF v_pass.registration_id IS NULL THEN RAISE EXCEPTION 'Pass is not linked to an event registration'; END IF;
      IF v_pass.kind <> 'event_ticket' AND v_pass.kind <> p_purpose
        AND NOT (v_pass.kind = 'badge' AND p_purpose = 'badge_print') THEN
        RAISE EXCEPTION 'Pass is not valid for this scan purpose';
      END IF;
      SELECT * INTO v_registration FROM public.event_registrations r
        WHERE r.id = v_pass.registration_id AND r.event_id = p_event_id AND r.status = 'registered'
        FOR UPDATE;
    END IF;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active credential not found for this event'; END IF;
  IF p_purpose = 'entry' AND v_registration.checked_in_at IS NOT NULL THEN
    RAISE EXCEPTION 'Attendee is already checked in';
  END IF;
  IF p_purpose IN ('parking','vip','certificate') AND NOT EXISTS (
    SELECT 1 FROM public.jesup_wallet_passes w
    WHERE w.registration_id = v_registration.id AND w.event_id = p_event_id
      AND w.kind = p_purpose AND w.status = 'active'
      AND (w.valid_from IS NULL OR w.valid_from <= now())
      AND (w.valid_until IS NULL OR w.valid_until >= now())
  ) THEN RAISE EXCEPTION 'This credential does not include the requested entitlement'; END IF;
  INSERT INTO public.event_scan_events(event_id, registration_id, pass_id, purpose, target_id, scanned_by)
    VALUES (p_event_id, v_registration.id, v_pass.id, p_purpose, p_target_id, auth.uid()) RETURNING * INTO v_scan;
  IF p_purpose = 'entry' THEN
    UPDATE public.event_registrations SET checked_in_at = COALESCE(checked_in_at, v_scan.scanned_at)
      WHERE id = v_registration.id;
    INSERT INTO public.event_attendance(event_id, registration_id, status, attendance_method, checked_in_at, checked_in_by)
      VALUES (p_event_id, v_registration.id, 'checked_in', 'qr', v_scan.scanned_at, auth.uid())
      ON CONFLICT (registration_id) WHERE registration_id IS NOT NULL DO UPDATE SET
        status = CASE WHEN public.event_attendance.status IN ('attended','virtual')
          THEN public.event_attendance.status ELSE 'checked_in'::public.attendance_status END,
        attendance_method = COALESCE(public.event_attendance.attendance_method, EXCLUDED.attendance_method),
        checked_in_at = COALESCE(public.event_attendance.checked_in_at, EXCLUDED.checked_in_at),
        checked_in_by = COALESCE(public.event_attendance.checked_in_by, EXCLUDED.checked_in_by);
  ELSIF p_purpose IN ('session','workshop') THEN
    INSERT INTO public.event_session_attendance(session_id, registration_id, checked_in_at, checked_in_by, method)
      VALUES (p_target_id, v_registration.id, v_scan.scanned_at, auth.uid(), 'qr')
      ON CONFLICT (session_id, registration_id) DO NOTHING;
  END IF;
  RETURN QUERY SELECT v_registration.id,
    COALESCE(v_registration.attendee_name, (SELECT p.full_name FROM public.profiles p WHERE p.id = v_registration.user_id), 'Attendee'),
    v_scan.id, v_scan.scanned_at;
END;
$$;
REVOKE ALL ON FUNCTION public.scan_jesup_credential(uuid,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.scan_jesup_credential(uuid,text,text,uuid) TO authenticated;

CREATE TABLE public.extension_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('session','speaker','publication','program','specialist','county','audience','outcome','resource')),
  source_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('session','speaker','publication','program','specialist','county','audience','outcome','resource')),
  target_id uuid NOT NULL,
  relationship text NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_id, target_type, target_id, relationship)
);
CREATE INDEX extension_links_source_idx ON public.extension_links(source_type, source_id);
ALTER TABLE public.extension_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "extension links public read" ON public.extension_links FOR SELECT TO anon, authenticated USING (is_public OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "extension links admin write" ON public.extension_links FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.extension_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.extension_links TO authenticated;
GRANT ALL ON public.extension_links TO service_role;

CREATE TABLE public.program_replication_guides (
  program_id uuid PRIMARY KEY REFERENCES public.programs(id) ON DELETE CASCADE,
  is_published boolean NOT NULL DEFAULT false,
  impact_metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
  curriculum jsonb NOT NULL DEFAULT '[]'::jsonb,
  resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  budget jsonb NOT NULL DEFAULT '{}'::jsonb,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  evaluation_methodology text,
  outcome_measures jsonb NOT NULL DEFAULT '[]'::jsonb,
  contact_name text,
  contact_email text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.program_replication_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "replication published read" ON public.program_replication_guides FOR SELECT TO anon, authenticated
  USING (is_published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "replication admin write" ON public.program_replication_guides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.program_replication_guides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.program_replication_guides TO authenticated;
GRANT ALL ON public.program_replication_guides TO service_role;

CREATE TABLE public.jesup_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id, code)
);
ALTER TABLE public.jesup_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements own read" ON public.jesup_achievements FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "achievements admin write" ON public.jesup_achievements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jesup_achievements TO authenticated;
GRANT ALL ON public.jesup_achievements TO service_role;

CREATE TABLE public.jesup_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  kind text NOT NULL CHECK (kind IN ('trivia','exhibitor','workshop','learning','connection')),
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  target_count integer NOT NULL DEFAULT 1 CHECK (target_count > 0),
  is_published boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jesup_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges published read" ON public.jesup_challenges FOR SELECT TO anon, authenticated
  USING (is_published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "challenges admin write" ON public.jesup_challenges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT ON public.jesup_challenges TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.jesup_challenges TO authenticated;
GRANT ALL ON public.jesup_challenges TO service_role;

CREATE TABLE public.jesup_challenge_progress (
  challenge_id uuid NOT NULL REFERENCES public.jesup_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_count integer NOT NULL DEFAULT 0 CHECK (current_count >= 0),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(challenge_id, user_id)
);
ALTER TABLE public.jesup_challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenge progress own read" ON public.jesup_challenge_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "challenge progress admin write" ON public.jesup_challenge_progress FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jesup_challenge_progress TO authenticated;
GRANT ALL ON public.jesup_challenge_progress TO service_role;

-- Restrict the existing meal redemption endpoint to organizers and serialize
-- redemptions for one registration so concurrent scanners cannot race allowances.
CREATE OR REPLACE FUNCTION public.redeem_event_meal_ticket(p_meal_day_id uuid, p_ticket_code text)
RETURNS TABLE(attendee_name text, event_title text, meal_label text, used_count integer, allowance integer, remaining integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_day public.event_meal_days%ROWTYPE;
  v_registration public.event_registrations%ROWTYPE;
  v_event_title text;
  v_used integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Organizer permission required';
  END IF;
  SELECT * INTO v_day FROM public.event_meal_days
    WHERE id = p_meal_day_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Meal service not found or inactive'; END IF;
  SELECT * INTO v_registration FROM public.event_registrations
    WHERE event_id = v_day.event_id
      AND (upper(ticket_code) = upper(btrim(p_ticket_code)) OR external_barcode = btrim(p_ticket_code))
      AND status = 'registered' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active ticket not found for this event'; END IF;
  SELECT title INTO v_event_title FROM public.events WHERE id = v_day.event_id;
  SELECT count(*)::integer INTO v_used FROM public.event_meal_redemptions
    WHERE meal_day_id = p_meal_day_id AND registration_id = v_registration.id;
  IF v_used >= v_day.allowance_per_attendee THEN
    RAISE EXCEPTION 'Meal allowance already used for this attendee';
  END IF;
  INSERT INTO public.event_meal_redemptions(meal_day_id, registration_id, redemption_number, redeemed_by)
    VALUES (p_meal_day_id, v_registration.id, v_used + 1, auth.uid());
  RETURN QUERY SELECT
    COALESCE(v_registration.attendee_name,
      (SELECT p.full_name FROM public.profiles p WHERE p.id = v_registration.user_id), 'Attendee'),
    v_event_title, v_day.label, v_used + 1, v_day.allowance_per_attendee,
    v_day.allowance_per_attendee - v_used - 1;
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_event_meal_ticket(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_event_meal_ticket(uuid,text) TO authenticated;
