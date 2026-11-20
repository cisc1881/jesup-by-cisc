-- PEARS identifiers and review queue. No PEARS secrets or participant-level data live here.
CREATE TABLE public.pears_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL UNIQUE REFERENCES public.institutions(id) ON DELETE CASCADE,
  organization_id text NOT NULL CHECK (length(trim(organization_id)) > 0),
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pears_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.pears_connections(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('program', 'event')),
  jesup_id uuid NOT NULL,
  pears_id text NOT NULL CHECK (length(trim(pears_id)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, entity_type, jesup_id),
  UNIQUE (connection_id, entity_type, pears_id)
);

CREATE TABLE public.pears_export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.pears_connections(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed')),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, event_id)
);

CREATE TRIGGER trg_pears_connections_updated BEFORE UPDATE ON public.pears_connections
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_pears_mappings_updated BEFORE UPDATE ON public.pears_mappings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_pears_export_jobs_updated BEFORE UPDATE ON public.pears_export_jobs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.pears_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pears_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pears_export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pears connections admin" ON public.pears_connections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "pears mappings admin" ON public.pears_mappings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "pears jobs admin read" ON public.pears_export_jobs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "pears jobs admin insert" ON public.pears_export_jobs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());
CREATE POLICY "pears jobs admin update" ON public.pears_export_jobs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "pears jobs admin delete" ON public.pears_export_jobs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pears_connections, public.pears_mappings, public.pears_export_jobs TO authenticated;
GRANT ALL ON public.pears_connections, public.pears_mappings, public.pears_export_jobs TO service_role;
