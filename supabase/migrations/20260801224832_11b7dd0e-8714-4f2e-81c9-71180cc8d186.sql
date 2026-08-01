ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS attendee_name text,
  ADD COLUMN IF NOT EXISTS attendee_email text,
  ADD COLUMN IF NOT EXISTS external_barcode text,
  ADD COLUMN IF NOT EXISTS registration_source text NOT NULL DEFAULT 'jesup',
  ADD COLUMN IF NOT EXISTS external_registration_id text,
  ADD COLUMN IF NOT EXISTS dietary_restrictions text,
  ADD COLUMN IF NOT EXISTS food_allergies text,
  ADD COLUMN IF NOT EXISTS accessibility_accommodations text,
  ADD COLUMN IF NOT EXISTS accommodation_consent boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS event_registrations_external_source_idx
  ON public.event_registrations (registration_source, external_registration_id)
  WHERE external_registration_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS event_registrations_ticket_code_idx
  ON public.event_registrations (event_id, ticket_code);

CREATE INDEX IF NOT EXISTS event_registrations_external_barcode_idx
  ON public.event_registrations (event_id, external_barcode);

CREATE TABLE IF NOT EXISTS public.event_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checked_in_by uuid,
  method text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS event_checkins_registration_id_key
  ON public.event_checkins (registration_id);

GRANT SELECT, INSERT, UPDATE ON public.event_checkins TO authenticated;
GRANT ALL ON public.event_checkins TO service_role;

ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_checkins_admin_all" ON public.event_checkins;
CREATE POLICY "event_checkins_admin_all"
  ON public.event_checkins
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.event_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_chat_messages_event_id_created_at_idx
  ON public.event_chat_messages (event_id, created_at);

GRANT ALL ON public.event_chat_messages TO service_role;

ALTER TABLE public.event_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_chat_messages_admin_all" ON public.event_chat_messages;
CREATE POLICY "event_chat_messages_admin_all"
  ON public.event_chat_messages
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.funder_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funder_user_id uuid NOT NULL,
  grant_id uuid NOT NULL REFERENCES public.grants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (funder_user_id, grant_id)
);

GRANT SELECT ON public.funder_grants TO authenticated;
GRANT ALL ON public.funder_grants TO service_role;

ALTER TABLE public.funder_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funder_grants_admin_all" ON public.funder_grants;
CREATE POLICY "funder_grants_admin_all"
  ON public.funder_grants
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "funder_grants_self_select" ON public.funder_grants;
CREATE POLICY "funder_grants_self_select"
  ON public.funder_grants
  FOR SELECT
  TO authenticated
  USING (funder_user_id = auth.uid());

DROP FUNCTION IF EXISTS public.get_event_registration_count(uuid);
CREATE OR REPLACE FUNCTION public.get_event_registration_count(p_event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.event_registrations
  WHERE event_id = p_event_id
    AND status <> 'cancelled';
$$;

GRANT EXECUTE ON FUNCTION public.get_event_registration_count(uuid) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.register_for_event(uuid, text, text);
CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id uuid,
  p_notes text DEFAULT NULL,
  p_invite_code text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  status text,
  ticket_code text,
  checked_in_at timestamptz,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_event public.events%ROWTYPE;
  v_reg_count integer;
  v_status text;
  v_ticket_code text;
  v_existing_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in is required to register';
  END IF;

  SELECT * INTO v_event FROM public.events e WHERE e.id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF v_event.registration_status = 'invite_only' THEN
    IF v_event.invite_code IS NULL OR p_invite_code IS DISTINCT FROM v_event.invite_code THEN
      RAISE EXCEPTION 'Invalid invite code';
    END IF;
  ELSIF v_event.registration_status NOT IN ('open', 'waiting_list') THEN
    RAISE EXCEPTION 'Registration is not open for this event';
  END IF;

  SELECT er.id INTO v_existing_id
  FROM public.event_registrations er
  WHERE er.event_id = p_event_id AND er.user_id = v_user_id;

  IF FOUND THEN
    RAISE EXCEPTION 'You are already registered for this event';
  END IF;

  SELECT count(*) INTO v_reg_count
  FROM public.event_registrations er
  WHERE er.event_id = p_event_id AND er.status = 'registered';

  IF v_event.capacity IS NOT NULL AND v_reg_count >= v_event.capacity THEN
    v_status := 'waiting_list';
  ELSE
    v_status := 'registered';
  END IF;

  v_ticket_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  RETURN QUERY
  INSERT INTO public.event_registrations (event_id, user_id, notes, status, ticket_code)
  VALUES (p_event_id, v_user_id, p_notes, v_status, v_ticket_code)
  RETURNING event_registrations.id, event_registrations.status, event_registrations.ticket_code,
            event_registrations.checked_in_at, event_registrations.notes;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_for_event(uuid, text, text) TO authenticated;

DROP FUNCTION IF EXISTS public.save_registration_accommodations(uuid, text, text, text, boolean);
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
DECLARE
  v_user_id uuid := auth.uid();
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.event_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration not found';
  END IF;
  IF v_owner IS DISTINCT FROM v_user_id AND NOT public.has_role(v_user_id, 'admin') THEN
    RAISE EXCEPTION 'Not authorized to update this registration';
  END IF;

  UPDATE public.event_registrations
  SET dietary_restrictions = p_dietary_restrictions,
      food_allergies = p_food_allergies,
      accessibility_accommodations = p_accessibility_accommodations,
      accommodation_consent = p_consent,
      updated_at = now()
  WHERE id = p_registration_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_registration_accommodations(uuid, text, text, text, boolean) TO authenticated;

DROP FUNCTION IF EXISTS public.list_event_chat(uuid);
CREATE OR REPLACE FUNCTION public.list_event_chat(p_event_id uuid)
RETURNS TABLE (
  id uuid,
  author_name text,
  message text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  IF NOT public.has_role(v_user_id, 'admin') AND NOT EXISTS (
    SELECT 1 FROM public.event_registrations er
    WHERE er.event_id = p_event_id
      AND er.user_id = v_user_id
      AND er.status <> 'cancelled'
  ) THEN
    RAISE EXCEPTION 'Only registered attendees may view this chat';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    COALESCE(p.full_name, 'Attendee') AS author_name,
    m.message,
    m.created_at
  FROM public.event_chat_messages m
  LEFT JOIN public.profiles p ON p.id = m.author_id
  WHERE m.event_id = p_event_id
  ORDER BY m.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_event_chat(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.post_event_chat(uuid, text);
CREATE OR REPLACE FUNCTION public.post_event_chat(p_event_id uuid, p_message text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_message text := btrim(p_message);
  v_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;
  IF v_message = '' OR v_message IS NULL THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  IF char_length(v_message) > 1000 THEN
    RAISE EXCEPTION 'Message is too long';
  END IF;

  IF NOT public.has_role(v_user_id, 'admin') AND NOT EXISTS (
    SELECT 1 FROM public.event_registrations er
    WHERE er.event_id = p_event_id
      AND er.user_id = v_user_id
      AND er.status <> 'cancelled'
  ) THEN
    RAISE EXCEPTION 'Only registered attendees may post to this chat';
  END IF;

  INSERT INTO public.event_chat_messages (event_id, author_id, message)
  VALUES (p_event_id, v_user_id, v_message)
  RETURNING event_chat_messages.id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_event_chat(uuid, text) TO authenticated;

DROP FUNCTION IF EXISTS public.get_my_funder_dashboard();
CREATE OR REPLACE FUNCTION public.get_my_funder_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;
  IF NOT public.has_role(v_user_id, 'funder') AND NOT public.has_role(v_user_id, 'admin') THEN
    RAISE EXCEPTION 'Funder role required';
  END IF;

  SELECT jsonb_build_object(
    'grants', COALESCE(jsonb_agg(g ORDER BY g->>'title'), '[]'::jsonb),
    'privacy', 'Aggregate grant metrics only. No attendee-level data is exposed.'
  )
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', gr.id,
      'title', gr.title,
      'funder', gr.funder,
      'amount', gr.amount,
      'deadline', gr.deadline,
      'events', COALESCE(ev_stats.event_count, 0),
      'registrations', COALESCE(ev_stats.registration_count, 0),
      'checked_in', COALESCE(ev_stats.checked_in_count, 0),
      'evaluations', COALESCE(ev_stats.evaluation_count, 0)
    ) AS g
    FROM public.funder_grants fg
    JOIN public.grants gr ON gr.id = fg.grant_id
    LEFT JOIN LATERAL (
      SELECT
        count(DISTINCT eg.event_id) AS event_count,
        count(DISTINCT er.id) FILTER (WHERE er.status <> 'cancelled') AS registration_count,
        count(DISTINCT ea.id) FILTER (WHERE ea.status IN ('checked_in', 'attended', 'virtual')) AS checked_in_count,
        count(DISTINCT ea.id) FILTER (WHERE ea.evaluation_completed_at IS NOT NULL) AS evaluation_count
      FROM public.event_grants eg
      LEFT JOIN public.event_registrations er ON er.event_id = eg.event_id
      LEFT JOIN public.event_attendance ea ON ea.event_id = eg.event_id
      WHERE eg.grant_id = fg.grant_id
    ) ev_stats ON true
    WHERE fg.funder_user_id = v_user_id
  ) sub;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_funder_dashboard() TO authenticated;

DROP FUNCTION IF EXISTS public.set_funder_grant_access(uuid, uuid, boolean);
CREATE OR REPLACE FUNCTION public.set_funder_grant_access(
  p_funder_user_id uuid,
  p_grant_id uuid,
  p_granted boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  IF p_granted THEN
    INSERT INTO public.funder_grants (funder_user_id, grant_id, created_by)
    VALUES (p_funder_user_id, p_grant_id, auth.uid())
    ON CONFLICT (funder_user_id, grant_id) DO NOTHING;
  ELSE
    DELETE FROM public.funder_grants
    WHERE funder_user_id = p_funder_user_id AND grant_id = p_grant_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_funder_grant_access(uuid, uuid, boolean) TO authenticated;