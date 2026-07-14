-- Participant confirmations and status updates for native JESUP workflows.

CREATE OR REPLACE FUNCTION public.create_user_notification(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text DEFAULT NULL,
  p_action_url text DEFAULT '/me',
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id, title, body, notification_type, priority, action_url,
    audience, channel, status, entity_type, entity_id
  ) VALUES (
    p_user_id, p_title, p_body, p_type, 'normal', p_action_url,
    'user', 'in_app', 'sent', p_entity_type, p_entity_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_user_notification(
  uuid, public.notification_type, text, text, text, text, uuid
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_user_notification(
  uuid, public.notification_type, text, text, text, text, uuid
) TO service_role;

CREATE OR REPLACE FUNCTION public.trg_confirm_event_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
BEGIN
  SELECT title INTO v_title FROM public.events WHERE id = NEW.event_id;
  PERFORM public.create_user_notification(
    NEW.user_id,
    'event_registration',
    CASE WHEN NEW.status = 'waiting_list' THEN 'You joined the waiting list' ELSE 'Event registration confirmed' END,
    format('%s · Ticket %s', COALESCE(v_title, 'JESUP event'), NEW.ticket_code),
    '/me',
    'event_registration',
    NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS confirm_event_registration ON public.event_registrations;
CREATE TRIGGER confirm_event_registration
  AFTER INSERT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.trg_confirm_event_registration();

CREATE OR REPLACE FUNCTION public.trg_confirm_internship_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_is_2fas boolean;
BEGIN
  SELECT title, is_2fas INTO v_title, v_is_2fas
  FROM public.internships WHERE id = NEW.internship_id;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_user_notification(
      NEW.user_id,
      'internship_application',
      'Application received',
      format('Your application for %s is now in review.', COALESCE(v_title, 'a JESUP opportunity')),
      '/me',
      'internship_application',
      NEW.id
    );

    IF NOT COALESCE(v_is_2fas, false) THEN
      PERFORM public.create_admin_notification(
        'internship_application',
        'New internship application',
        format('A new application was submitted for %s.', COALESCE(v_title, 'an internship')),
        '/admin/internships',
        'normal',
        'internship_application',
        NEW.id
      );
    END IF;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.create_user_notification(
      NEW.user_id,
      'internship_application',
      'Application status updated',
      format('%s is now %s.', COALESCE(v_title, 'Your application'), replace(NEW.status::text, '_', ' ')),
      '/me',
      'internship_application',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS confirm_internship_application ON public.internship_applications;
CREATE TRIGGER confirm_internship_application
  AFTER INSERT OR UPDATE OF status ON public.internship_applications
  FOR EACH ROW EXECUTE FUNCTION public.trg_confirm_internship_application();

CREATE OR REPLACE FUNCTION public.trg_confirm_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_user_notification(
      NEW.user_id,
      'inquiry_received',
      'Inquiry received',
      format('Reference %s · A JESUP team member will follow up.', upper(left(NEW.id::text, 8))),
      '/me',
      'inquiry',
      NEW.id
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.create_user_notification(
      NEW.user_id,
      'inquiry_received',
      'Inquiry status updated',
      format('Reference %s is now %s.', upper(left(NEW.id::text, 8)), replace(NEW.status::text, '_', ' ')),
      '/me',
      'inquiry',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS confirm_inquiry ON public.inquiries;
CREATE TRIGGER confirm_inquiry
  AFTER INSERT OR UPDATE OF status ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.trg_confirm_inquiry();
