-- Sprint 11 Phase 1: Severe weather notification subscriptions and alert preferences
-- Development project only — do not apply to production annwryirualnxsrnupjm

CREATE TYPE public.weather_alert_delivery_status AS ENUM (
  'pending',
  'sent',
  'suppressed',
  'failed',
  'test'
);

COMMENT ON TYPE public.weather_alert_delivery_status IS
  'Delivery lifecycle for processed NWS alerts. test = development-only local notification.';

CREATE TABLE IF NOT EXISTS public.weather_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  watches_enabled BOOLEAN NOT NULL DEFAULT true,
  warnings_enabled BOOLEAN NOT NULL DEFAULT true,
  emergencies_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_forecast_enabled BOOLEAN NOT NULL DEFAULT false,
  location_source TEXT,
  county_name TEXT,
  state_code CHAR(2),
  latitude_bucket NUMERIC(6, 2),
  longitude_bucket NUMERIC(7, 2),
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  last_alert_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT weather_notification_preferences_user_unique UNIQUE (user_id),
  CONSTRAINT weather_notification_preferences_state_code_upper CHECK (
    state_code IS NULL OR state_code = upper(state_code)
  )
);

COMMENT ON TABLE public.weather_notification_preferences IS
  'Opt-in severe weather notification preferences per authenticated user. Coarse location buckets only — not precise coordinates.';

COMMENT ON COLUMN public.weather_notification_preferences.latitude_bucket IS
  'Coarse latitude rounded to 0.1 degrees for alert targeting without storing precise browser coordinates.';

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  device_label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_success_at TIMESTAMPTZ,
  failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint)
);

COMMENT ON TABLE public.push_subscriptions IS
  'Browser push subscription endpoints per user device. Managed by authenticated users; admins may deactivate broken subscriptions.';

CREATE TABLE IF NOT EXISTS public.processed_weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nws_alert_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  severity TEXT NOT NULL,
  event_name TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  delivery_status public.weather_alert_delivery_status NOT NULL DEFAULT 'pending',
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT processed_weather_alerts_user_nws_unique UNIQUE (user_id, nws_alert_id)
);

COMMENT ON TABLE public.processed_weather_alerts IS
  'Deduplication ledger — prevents sending the same NWS alert twice to the same user.';

CREATE INDEX IF NOT EXISTS idx_weather_notification_preferences_enabled
  ON public.weather_notification_preferences (enabled)
  WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active
  ON public.push_subscriptions (user_id, is_active)
  WHERE is_active = true AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_processed_weather_alerts_user_created
  ON public.processed_weather_alerts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_processed_weather_alerts_nws
  ON public.processed_weather_alerts (nws_alert_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weather_notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT SELECT, INSERT ON public.processed_weather_alerts TO authenticated;
GRANT ALL ON public.weather_notification_preferences TO service_role;
GRANT ALL ON public.push_subscriptions TO service_role;
GRANT ALL ON public.processed_weather_alerts TO service_role;

ALTER TABLE public.weather_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_weather_alerts ENABLE ROW LEVEL SECURITY;

-- Preferences: users manage own rows only
CREATE POLICY "weather prefs select own"
  ON public.weather_notification_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "weather prefs insert own"
  ON public.weather_notification_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "weather prefs update own"
  ON public.weather_notification_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "weather prefs delete own"
  ON public.weather_notification_preferences FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Push subscriptions: users manage own; admins inspect and deactivate
CREATE POLICY "push subs select own or admin"
  ON public.push_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "push subs insert own"
  ON public.push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push subs update own or admin deactivate"
  ON public.push_subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "push subs delete own"
  ON public.push_subscriptions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Processed alerts: users read own; insert own (for future worker); admins inspect
CREATE POLICY "processed alerts select own or admin"
  ON public.processed_weather_alerts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "processed alerts insert own"
  ON public.processed_weather_alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER weather_notification_preferences_set_updated_at
  BEFORE UPDATE ON public.weather_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER push_subscriptions_set_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
