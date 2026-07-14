-- Sprint 2: JESUP Notification Center

CREATE TYPE public.notification_type AS ENUM (
  'twofas_application',
  'event_registration',
  'event_near_capacity',
  'publication_added',
  'equipment_request',
  'grant_deadline'
);

CREATE TYPE public.notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TYPE public.notification_audience AS ENUM ('admin', 'user');

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS notification_type public.notification_type,
  ADD COLUMN IF NOT EXISTS priority public.notification_priority NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS action_url TEXT,
  ADD COLUMN IF NOT EXISTS audience public.notification_audience NOT NULL DEFAULT 'admin';

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_audience_created
  ON public.notifications (audience, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user
  ON public.notification_reads (user_id, notification_id);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.notification_reads TO authenticated;
GRANT ALL ON public.notification_reads TO service_role;

CREATE POLICY "notification_reads select own"
  ON public.notification_reads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notification_reads insert own visible"
  ON public.notification_reads FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.id = notification_id
        AND (
          (n.audience = 'admin' AND public.has_role(auth.uid(), 'admin'))
          OR n.user_id = auth.uid()
        )
    )
  );

-- Admin notifications: admins read/update admin audience rows
DROP POLICY IF EXISTS "notifications_admin_select" ON public.notifications;
CREATE POLICY "notifications_admin_select"
  ON public.notifications FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND (audience = 'admin' OR user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "notifications_user_read" ON public.notifications;
CREATE POLICY "notifications_user_read"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND audience = 'user');

DROP POLICY IF EXISTS "notifications_admin_update" ON public.notifications;
CREATE POLICY "notifications_admin_update"
  ON public.notifications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "notifications_user_update" ON public.notifications;
CREATE POLICY "notifications_user_update"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND audience = 'user')
  WITH CHECK (auth.uid() = user_id AND audience = 'user');

CREATE OR REPLACE FUNCTION public.create_admin_notification(
  p_type public.notification_type,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_priority public.notification_priority DEFAULT 'normal',
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications (
    title,
    body,
    notification_type,
    priority,
    action_url,
    audience,
    channel,
    status,
    entity_type,
    entity_id
  ) VALUES (
    p_title,
    p_body,
    p_type,
    p_priority,
    p_action_url,
    'admin',
    'in_app',
    'sent',
    p_entity_type,
    p_entity_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_admin_notification(
  public.notification_type, TEXT, TEXT, TEXT, public.notification_priority, TEXT, UUID
) TO authenticated, service_role;

-- 2FAS application submitted
CREATE OR REPLACE FUNCTION public.trg_notify_twofas_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_is_2fas BOOLEAN;
BEGIN
  SELECT i.title, i.is_2fas INTO v_title, v_is_2fas
  FROM public.internships i
  WHERE i.id = NEW.internship_id;

  IF COALESCE(v_is_2fas, false) THEN
    PERFORM public.create_admin_notification(
      'twofas_application',
      'New 2FAS application',
      format('A new application was submitted for %s.', COALESCE(v_title, 'a 2FAS opportunity')),
      '/admin/2fas/applications',
      'high',
      'internship_application',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_twofas_application ON public.internship_applications;
CREATE TRIGGER notify_twofas_application
  AFTER INSERT ON public.internship_applications
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_twofas_application();

-- Event registration submitted
CREATE OR REPLACE FUNCTION public.trg_notify_event_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_capacity INT;
  v_count INT;
BEGIN
  SELECT e.title, e.capacity INTO v_title, v_capacity
  FROM public.events e
  WHERE e.id = NEW.event_id;

  PERFORM public.create_admin_notification(
    'event_registration',
    'New event registration',
    format('A registrant signed up for %s.', COALESCE(v_title, 'an event')),
    '/admin/events',
    'normal',
    'event_registration',
    NEW.id
  );

  IF v_capacity IS NOT NULL AND v_capacity > 0 THEN
    SELECT public.get_event_registration_count(NEW.event_id)::INT INTO v_count;
    IF v_count >= v_capacity OR (v_capacity - v_count) <= 3 OR (v_count::NUMERIC / v_capacity) >= 0.75 THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.notification_type = 'event_near_capacity'
          AND n.entity_id = NEW.event_id
          AND n.created_at > now() - INTERVAL '24 hours'
      ) THEN
        PERFORM public.create_admin_notification(
          'event_near_capacity',
          'Event nearing capacity',
          format('%s has %s of %s seats filled.', COALESCE(v_title, 'An event'), v_count, v_capacity),
          '/admin/events',
          CASE WHEN v_count >= v_capacity THEN 'urgent' ELSE 'high' END,
          'event',
          NEW.event_id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_event_registration ON public.event_registrations;
CREATE TRIGGER notify_event_registration
  AFTER INSERT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_event_registration();

-- Publication added
CREATE OR REPLACE FUNCTION public.trg_notify_publication_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.is_active, true) THEN
    PERFORM public.create_admin_notification(
      'publication_added',
      'New publication added',
      format('"%s" was added to the publications library.', NEW.title),
      '/admin/publications',
      'normal',
      'publication',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_publication_added ON public.publications;
CREATE TRIGGER notify_publication_added
  AFTER INSERT ON public.publications
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_publication_added();

-- Equipment checkout request
CREATE OR REPLACE FUNCTION public.trg_notify_equipment_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT e.name INTO v_name FROM public.equipment e WHERE e.id = NEW.equipment_id;
    PERFORM public.create_admin_notification(
      'equipment_request',
      'Equipment request submitted',
      format('A checkout request was submitted for %s.', COALESCE(v_name, 'equipment')),
      '/admin/equipment',
      'normal',
      'equipment_checkout',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_equipment_request ON public.equipment_checkouts;
CREATE TRIGGER notify_equipment_request
  AFTER INSERT ON public.equipment_checkouts
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_equipment_request();

-- Grant deadline approaching (within 14 days)
CREATE OR REPLACE FUNCTION public.trg_notify_grant_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deadline IS NOT NULL
    AND NEW.deadline >= CURRENT_DATE
    AND NEW.deadline <= CURRENT_DATE + 14
  THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.notification_type = 'grant_deadline'
        AND n.entity_id = NEW.id
        AND n.created_at > now() - INTERVAL '7 days'
    ) THEN
      PERFORM public.create_admin_notification(
        'grant_deadline',
        'Grant deadline approaching',
        format('"%s" deadline is %s.', NEW.title, to_char(NEW.deadline, 'Mon DD, YYYY')),
        '/admin/grants',
        CASE WHEN NEW.deadline <= CURRENT_DATE + 3 THEN 'urgent' ELSE 'high' END,
        'grant',
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_grant_deadline ON public.grants;
CREATE TRIGGER notify_grant_deadline
  AFTER INSERT OR UPDATE OF deadline, title ON public.grants
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_grant_deadline();
