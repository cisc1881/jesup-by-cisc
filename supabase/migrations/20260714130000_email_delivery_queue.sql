-- Durable email queue for participant confirmations. Delivery is performed by
-- the process-email-queue Edge Function so provider credentials never reach the app.

CREATE TYPE public.email_delivery_status AS ENUM ('pending', 'processing', 'sent', 'failed');

CREATE TABLE public.email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  action_url text,
  status public.email_delivery_status NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  provider_message_id text,
  last_error text,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_deliveries_recipient_check CHECK (recipient ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);

CREATE INDEX email_deliveries_pending_idx
  ON public.email_deliveries (next_attempt_at, created_at)
  WHERE status IN ('pending', 'failed');

ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.email_deliveries TO authenticated;
GRANT ALL ON public.email_deliveries TO service_role;

CREATE POLICY "email deliveries admin read"
  ON public.email_deliveries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "email deliveries admin retry"
  ON public.email_deliveries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER email_deliveries_set_updated_at
  BEFORE UPDATE ON public.email_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.trg_queue_user_notification_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF NEW.audience <> 'user' OR NEW.channel <> 'in_app' OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT email INTO v_email FROM public.profiles WHERE id = NEW.user_id;
  IF NULLIF(btrim(v_email), '') IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.email_deliveries (notification_id, recipient, subject, body, action_url)
  VALUES (NEW.id, lower(btrim(v_email)), NEW.title, COALESCE(NEW.body, ''), NEW.action_url);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS queue_user_notification_email ON public.notifications;
CREATE TRIGGER queue_user_notification_email
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.trg_queue_user_notification_email();

-- Anonymous inquiries have no profile/user notification, but still receive the
-- same receipt at the address entered on the form.
CREATE OR REPLACE FUNCTION public.trg_queue_anonymous_inquiry_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.email_deliveries (recipient, subject, body, action_url)
    VALUES (
      lower(btrim(NEW.email)),
      'Inquiry received',
      format('Reference %s · A JESUP team member will follow up.', upper(left(NEW.id::text, 8))),
      '/join'
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.email_deliveries (recipient, subject, body, action_url)
    VALUES (
      lower(btrim(NEW.email)),
      'Inquiry status updated',
      format('Reference %s is now %s.', upper(left(NEW.id::text, 8)), replace(NEW.status::text, '_', ' ')),
      '/join'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS queue_anonymous_inquiry_email ON public.inquiries;
CREATE TRIGGER queue_anonymous_inquiry_email
  AFTER INSERT OR UPDATE OF status ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.trg_queue_anonymous_inquiry_email();

CREATE OR REPLACE FUNCTION public.claim_email_deliveries(p_limit int DEFAULT 25)
RETURNS SETOF public.email_deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.email_deliveries d
  SET status = 'processing', attempts = attempts + 1, updated_at = now()
  WHERE d.id IN (
    SELECT id
    FROM public.email_deliveries
    WHERE status IN ('pending', 'failed')
      AND next_attempt_at <= now()
      AND attempts < 5
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 100)
  )
  RETURNING d.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_email_deliveries(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_email_deliveries(int) TO service_role;
