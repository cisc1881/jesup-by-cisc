-- Secure, native event registration. Invite codes are validated server-side and
-- capacity assignment is serialized per event.

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
  SELECT capacity, registration_status INTO cap, evt_status
  FROM public.events
  WHERE id = NEW.event_id;

  IF evt_status IN ('closed', 'sold_out') THEN
    RAISE EXCEPTION 'Registration is closed';
  END IF;

  IF cap IS NULL THEN
    NEW.status := 'registered';
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

CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id uuid,
  p_notes text DEFAULT NULL,
  p_invite_code text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  status public.event_registration_record_status,
  ticket_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_event public.events%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in is required to register';
  END IF;

  SELECT * INTO v_event
  FROM public.events
  WHERE events.id = p_event_id
  FOR UPDATE;

  IF NOT FOUND OR NOT v_event.is_active OR v_event.status <> 'published' THEN
    RAISE EXCEPTION 'Event is unavailable';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.event_registrations r
    WHERE r.event_id = p_event_id AND r.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'You already registered for this event';
  END IF;

  IF v_event.registration_status = 'invite_only'
     AND (v_event.invite_code IS NULL OR p_invite_code IS DISTINCT FROM v_event.invite_code) THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF v_event.registration_status IN ('closed', 'sold_out')
     OR (v_event.registration_status <> 'invite_only' AND NOT v_event.registration_open) THEN
    RAISE EXCEPTION 'Registration is closed';
  END IF;

  RETURN QUERY
  INSERT INTO public.event_registrations (event_id, user_id, notes)
  VALUES (p_event_id, v_user_id, NULLIF(btrim(p_notes), ''))
  RETURNING event_registrations.id, event_registrations.status, event_registrations.ticket_code;
END;
$$;

REVOKE INSERT ON public.event_registrations FROM authenticated;
REVOKE ALL ON FUNCTION public.register_for_event(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_for_event(uuid, text, text) TO authenticated;
