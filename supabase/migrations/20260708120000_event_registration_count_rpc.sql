-- Public aggregate count for event registrations (bypasses per-user RLS on event_registrations).
CREATE OR REPLACE FUNCTION public.get_event_registration_count(p_event_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.event_registrations
  WHERE event_id = p_event_id
    AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = p_event_id);
$$;

REVOKE ALL ON FUNCTION public.get_event_registration_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_registration_count(uuid) TO anon, authenticated;

-- Prevent registrations once an event reaches capacity.
CREATE OR REPLACE FUNCTION public.enforce_event_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap int;
  reg_count bigint;
BEGIN
  SELECT capacity INTO cap FROM public.events WHERE id = NEW.event_id;
  IF cap IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO reg_count
  FROM public.event_registrations
  WHERE event_id = NEW.event_id;

  IF reg_count >= cap THEN
    RAISE EXCEPTION 'Event is at capacity';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_event_capacity
  BEFORE INSERT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_event_capacity();
