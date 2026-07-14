-- Recompile the legacy event-registration notification trigger with explicit
-- enum casts so notification type extensions cannot break function resolution.

CREATE OR REPLACE FUNCTION public.trg_notify_event_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_capacity int;
  v_count int;
BEGIN
  SELECT e.title, e.capacity INTO v_title, v_capacity
  FROM public.events e
  WHERE e.id = NEW.event_id;

  PERFORM public.create_admin_notification(
    'event_registration'::public.notification_type,
    'New event registration'::text,
    format('A registrant signed up for %s.', COALESCE(v_title, 'an event')),
    '/admin/events'::text,
    'normal'::public.notification_priority,
    'event_registration'::text,
    NEW.id
  );

  IF v_capacity IS NOT NULL AND v_capacity > 0 THEN
    SELECT public.get_event_registration_count(NEW.event_id)::int INTO v_count;
    IF v_count >= v_capacity OR (v_capacity - v_count) <= 3 OR (v_count::numeric / v_capacity) >= 0.75 THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.notification_type = 'event_near_capacity'
          AND n.entity_id = NEW.event_id
          AND n.created_at > now() - interval '24 hours'
      ) THEN
        PERFORM public.create_admin_notification(
          'event_near_capacity'::public.notification_type,
          'Event nearing capacity'::text,
          format('%s has %s of %s seats filled.', COALESCE(v_title, 'An event'), v_count, v_capacity),
          '/admin/events'::text,
          CASE
            WHEN v_count >= v_capacity THEN 'urgent'::public.notification_priority
            ELSE 'high'::public.notification_priority
          END,
          'event'::text,
          NEW.event_id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
