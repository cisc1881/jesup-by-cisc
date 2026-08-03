CREATE TABLE IF NOT EXISTS public.event_registration_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.event_sessions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (registration_id, session_id)
);

CREATE INDEX IF NOT EXISTS event_registration_sessions_registration_idx
  ON public.event_registration_sessions(registration_id);
CREATE INDEX IF NOT EXISTS event_registration_sessions_session_idx
  ON public.event_registration_sessions(session_id);

ALTER TABLE public.event_registration_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.event_registration_sessions TO authenticated;
GRANT ALL ON public.event_registration_sessions TO service_role;

DROP POLICY IF EXISTS "attendees manage own session plans" ON public.event_registration_sessions;
CREATE POLICY "attendees manage own session plans"
  ON public.event_registration_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.event_registrations registration
      WHERE registration.id = event_registration_sessions.registration_id
        AND (registration.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.event_registrations registration
      JOIN public.event_sessions session ON session.id = event_registration_sessions.session_id
      WHERE registration.id = event_registration_sessions.registration_id
        AND registration.event_id = session.event_id
        AND (registration.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );
