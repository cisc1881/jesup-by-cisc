-- Sprint 11 Phase 2: Delayed deliveries, poll run ledger, delivery status extension
-- Development project only — do not apply to production annwryirualnxsrnupjm

ALTER TYPE public.weather_alert_delivery_status ADD VALUE IF NOT EXISTS 'expired';

CREATE TYPE public.weather_delayed_delivery_status AS ENUM (
  'pending',
  'sent',
  'expired',
  'failed',
  'suppressed'
);

COMMENT ON TYPE public.weather_delayed_delivery_status IS
  'Quiet-hours delay queue status for non-emergency alerts.';

CREATE TABLE IF NOT EXISTS public.weather_alert_delayed_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nws_alert_id TEXT NOT NULL,
  severity TEXT NOT NULL,
  event_name TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status public.weather_delayed_delivery_status NOT NULL DEFAULT 'pending',
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT weather_alert_delayed_user_nws_unique UNIQUE (user_id, nws_alert_id)
);

COMMENT ON TABLE public.weather_alert_delayed_deliveries IS
  'Non-emergency alerts delayed by quiet hours. Never delivered after alert expiry.';

CREATE TABLE IF NOT EXISTS public.weather_alert_poll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trigger_source TEXT NOT NULL DEFAULT 'manual',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  groups_polled INTEGER NOT NULL DEFAULT 0,
  alerts_fetched INTEGER NOT NULL DEFAULT 0,
  deliveries_sent INTEGER NOT NULL DEFAULT 0,
  deliveries_delayed INTEGER NOT NULL DEFAULT 0,
  deliveries_suppressed INTEGER NOT NULL DEFAULT 0,
  deliveries_failed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.weather_alert_poll_runs IS
  'Development poll cycle audit log — one row per manual or scheduled poll run.';

CREATE INDEX IF NOT EXISTS idx_weather_alert_delayed_pending
  ON public.weather_alert_delayed_deliveries (status, scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_weather_alert_delayed_user
  ON public.weather_alert_delayed_deliveries (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_weather_alert_poll_runs_started
  ON public.weather_alert_poll_runs (started_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.weather_alert_delayed_deliveries TO authenticated;
GRANT SELECT ON public.weather_alert_poll_runs TO authenticated;
GRANT ALL ON public.weather_alert_delayed_deliveries TO service_role;
GRANT ALL ON public.weather_alert_poll_runs TO service_role;

ALTER TABLE public.weather_alert_delayed_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_alert_poll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delayed deliveries select own or admin"
  ON public.weather_alert_delayed_deliveries FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "delayed deliveries insert own"
  ON public.weather_alert_delayed_deliveries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delayed deliveries update own or admin"
  ON public.weather_alert_delayed_deliveries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "poll runs select admin"
  ON public.weather_alert_poll_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER weather_alert_delayed_deliveries_set_updated_at
  BEFORE UPDATE ON public.weather_alert_delayed_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
