-- Phase 9H event report snapshots
-- Applied: development (verified July 2026)

CREATE TYPE public.event_report_status AS ENUM ('draft', 'final');

CREATE TABLE IF NOT EXISTS public.event_report_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  event_ids UUID[] NOT NULL DEFAULT '{}',
  title TEXT NOT NULL DEFAULT 'Event Report',
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  narrative_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  metrics_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at TIMESTAMPTZ,
  status public.event_report_status NOT NULL DEFAULT 'draft'
);

CREATE INDEX IF NOT EXISTS idx_event_report_snapshots_created_by
  ON public.event_report_snapshots (created_by, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_report_snapshots_event_ids
  ON public.event_report_snapshots USING GIN (event_ids);

CREATE TRIGGER trg_event_report_snapshots_updated
  BEFORE UPDATE ON public.event_report_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.event_report_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_report_snapshots admin select"
  ON public.event_report_snapshots
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "event_report_snapshots admin insert"
  ON public.event_report_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND created_by = auth.uid()
  );

CREATE POLICY "event_report_snapshots admin update"
  ON public.event_report_snapshots
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "event_report_snapshots admin delete"
  ON public.event_report_snapshots
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_report_snapshots TO authenticated;
GRANT ALL ON public.event_report_snapshots TO service_role;

-- RLS review:
-- - Admin-only read/write via has_role('admin')
-- - created_by must match auth.uid() on insert
-- - metrics_snapshot stores frozen aggregate metrics at finalization
-- - narrative_fields stores manual report text; never overwrites event records
-- - No anon access; no raw demographic rows stored in snapshots
