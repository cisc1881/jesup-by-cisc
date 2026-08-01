-- Restricted funder accounts: aggregate grant metrics only, never attendee-level data.

CREATE TABLE IF NOT EXISTS public.grant_funder_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL REFERENCES public.grants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grant_id, user_id)
);

ALTER TABLE public.grant_funder_access ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.grant_funder_access TO authenticated;
GRANT ALL ON public.grant_funder_access TO service_role;

CREATE POLICY "funders read own grant access" ON public.grant_funder_access
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage funder grant access" ON public.grant_funder_access
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_my_funder_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'funder') AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Funder access required';
  END IF;

  SELECT coalesce(jsonb_agg(grant_row ORDER BY grant_row->>'title'), '[]'::jsonb)
  INTO result
  FROM (
    SELECT jsonb_build_object(
      'id', g.id,
      'title', g.title,
      'funder', g.funder,
      'amount', g.amount,
      'deadline', g.deadline,
      'events', count(DISTINCT eg.event_id),
      'registrations', count(DISTINCT er.id),
      'checked_in', count(DISTINCT er.id) FILTER (WHERE er.checked_in_at IS NOT NULL),
      'evaluations', count(DISTINCT eer.id)
    ) AS grant_row
    FROM public.grant_funder_access gfa
    JOIN public.grants g ON g.id = gfa.grant_id
    LEFT JOIN public.event_grants eg ON eg.grant_id = g.id
    LEFT JOIN public.event_registrations er ON er.event_id = eg.event_id AND er.status <> 'cancelled'
    LEFT JOIN public.event_evaluation_responses eer ON eer.event_id = eg.event_id AND eer.submitted_at IS NOT NULL
    WHERE gfa.user_id = auth.uid()
    GROUP BY g.id, g.title, g.funder, g.amount, g.deadline
  ) rows;

  RETURN jsonb_build_object('grants', result, 'privacy', 'Aggregate metrics only');
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_funder_dashboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_funder_dashboard() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_funder_grant_access(
  p_user_id uuid,
  p_grant_id uuid,
  p_enabled boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF NOT public.has_role(p_user_id, 'funder') THEN RAISE EXCEPTION 'User must have the funder role first'; END IF;
  IF p_enabled THEN
    INSERT INTO public.grant_funder_access (grant_id, user_id, created_by)
    VALUES (p_grant_id, p_user_id, auth.uid()) ON CONFLICT (grant_id, user_id) DO NOTHING;
  ELSE
    DELETE FROM public.grant_funder_access WHERE grant_id = p_grant_id AND user_id = p_user_id;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.set_funder_grant_access(uuid, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_funder_grant_access(uuid, uuid, boolean) TO authenticated;

-- Registered-attendee event chat and session-level attendance.
CREATE TABLE IF NOT EXISTS public.event_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 1 AND 1000),
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_session_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checked_in_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  method text NOT NULL DEFAULT 'qr',
  UNIQUE (session_id, registration_id)
);

ALTER TABLE public.event_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_session_attendance ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.event_chat_messages TO authenticated;
GRANT SELECT ON public.event_session_attendance TO authenticated;
GRANT ALL ON public.event_chat_messages, public.event_session_attendance TO service_role;

CREATE POLICY "registered attendees read event chat" ON public.event_chat_messages
  FOR SELECT TO authenticated USING (
    is_hidden = false AND EXISTS (
      SELECT 1 FROM public.event_registrations r
      WHERE r.event_id = event_chat_messages.event_id AND r.user_id = auth.uid() AND r.status <> 'cancelled'
    )
  );
CREATE POLICY "registered attendees post event chat" ON public.event_chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.event_registrations r
      WHERE r.event_id = event_chat_messages.event_id AND r.user_id = auth.uid() AND r.status <> 'cancelled'
    )
  );
CREATE POLICY "attendees read own session attendance" ON public.event_session_attendance
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.event_registrations r WHERE r.id = registration_id AND r.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE OR REPLACE FUNCTION public.list_event_chat(p_event_id uuid)
RETURNS TABLE (id uuid, message text, created_at timestamptz, author_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.message, m.created_at, coalesce(p.full_name, 'JESUP attendee')
  FROM public.event_chat_messages m
  LEFT JOIN public.profiles p ON p.id = m.user_id
  WHERE m.event_id = p_event_id AND m.is_hidden = false
    AND (public.has_role(auth.uid(), 'admin') OR EXISTS (
      SELECT 1 FROM public.event_registrations r WHERE r.event_id = p_event_id AND r.user_id = auth.uid() AND r.status <> 'cancelled'
    ))
  ORDER BY m.created_at ASC LIMIT 250;
$$;
GRANT EXECUTE ON FUNCTION public.list_event_chat(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.post_event_chat(p_event_id uuid, p_message text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.event_registrations r WHERE r.event_id = p_event_id AND r.user_id = auth.uid() AND r.status <> 'cancelled') THEN
    RAISE EXCEPTION 'Registration required';
  END IF;
  INSERT INTO public.event_chat_messages (event_id, user_id, message)
  VALUES (p_event_id, auth.uid(), btrim(p_message)) RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.post_event_chat(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.check_in_event_session(p_session_id uuid, p_ticket_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE registration public.event_registrations%ROWTYPE; session_event uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT event_id INTO session_event FROM public.event_sessions WHERE id = p_session_id;
  SELECT * INTO registration FROM public.event_registrations
  WHERE event_id = session_event AND upper(ticket_code) = upper(btrim(p_ticket_code)) AND status <> 'cancelled';
  IF NOT FOUND THEN RAISE EXCEPTION 'Valid attendee ticket not found'; END IF;
  INSERT INTO public.event_session_attendance (session_id, registration_id, checked_in_by)
  VALUES (p_session_id, registration.id, auth.uid()) ON CONFLICT (session_id, registration_id) DO NOTHING;
  RETURN jsonb_build_object('registration_id', registration.id, 'session_id', p_session_id, 'checked_in', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_in_event_session(uuid, text) TO authenticated;
