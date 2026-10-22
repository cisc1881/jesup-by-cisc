CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT auth.uid() IS NOT NULL AND _user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO anon,authenticated,service_role;
COMMENT ON FUNCTION public.has_role(uuid,public.app_role) IS 'RLS helper: anonymous returns false; authenticated callers can inspect only their own role.';
CREATE TABLE IF NOT EXISTS public.event_registration_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), registration_id uuid NOT NULL REFERENCES public.event_registrations(id),
 session_id uuid NOT NULL REFERENCES public.event_sessions(id), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(registration_id,session_id)
);
GRANT SELECT,INSERT,DELETE ON public.event_registration_sessions TO authenticated;
GRANT ALL ON public.event_registration_sessions TO service_role;
ALTER TABLE public.event_registration_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY fc135_session_plan_owner ON public.event_registration_sessions FOR ALL TO authenticated
USING(EXISTS(SELECT 1 FROM public.event_registrations r WHERE r.id=registration_id AND (r.user_id=auth.uid() OR public.has_role(auth.uid(),'admin'))))
WITH CHECK(EXISTS(SELECT 1 FROM public.event_registrations r JOIN public.event_sessions s ON s.id=session_id WHERE r.id=registration_id AND r.event_id=s.event_id AND (r.user_id=auth.uid() OR public.has_role(auth.uid(),'admin'))));