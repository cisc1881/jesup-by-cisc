
ALTER VIEW public.program_podcasts SET (security_invoker = true);
ALTER VIEW public.publication_programs SET (security_invoker = true);

CREATE OR REPLACE FUNCTION public.enforce_equipment_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INT;
  v_reserved INT;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity < 1 THEN
    RAISE EXCEPTION 'quantity must be >= 1';
  END IF;
  IF NEW.return_date < NEW.checkout_date THEN
    RAISE EXCEPTION 'return_date must be on or after checkout_date';
  END IF;

  SELECT quantity_total INTO v_total FROM public.equipment WHERE id = NEW.equipment_id;
  IF v_total IS NULL THEN
    RAISE EXCEPTION 'equipment not found';
  END IF;
  IF NEW.quantity > v_total THEN
    RAISE EXCEPTION 'requested quantity exceeds inventory';
  END IF;

  IF NEW.status IN ('approved', 'checked_out') THEN
    SELECT COALESCE(SUM(quantity), 0) INTO v_reserved
    FROM public.equipment_checkouts
    WHERE equipment_id = NEW.equipment_id
      AND status IN ('approved', 'checked_out')
      AND (TG_OP = 'INSERT' OR id <> NEW.id)
      AND checkout_date <= NEW.return_date
      AND return_date >= NEW.checkout_date;

    IF v_reserved + NEW.quantity > v_total THEN
      RAISE EXCEPTION 'not enough equipment available for the requested window (% of % reserved)', v_reserved, v_total;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_equipment_availability ON public.equipment_checkouts;
CREATE TRIGGER trg_enforce_equipment_availability
BEFORE INSERT OR UPDATE ON public.equipment_checkouts
FOR EACH ROW EXECUTE FUNCTION public.enforce_equipment_availability();

CREATE OR REPLACE FUNCTION public.enforce_event_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap int;
  reg_count bigint;
  evt_status public.event_registration_status;
  evt_reg_open boolean;
  evt_is_active boolean;
  evt_pub_status text;
BEGIN
  SELECT capacity, registration_status, registration_open, is_active, status::text
    INTO cap, evt_status, evt_reg_open, evt_is_active, evt_pub_status
  FROM public.events WHERE id = NEW.event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'event not found';
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    NEW.status := COALESCE(NEW.status, 'registered');
    RETURN NEW;
  END IF;

  IF evt_is_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Event is not active';
  END IF;
  IF evt_pub_status IS DISTINCT FROM 'published' THEN
    RAISE EXCEPTION 'Event is not open for public registration';
  END IF;
  IF evt_reg_open IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Registration is closed for this event';
  END IF;

  IF evt_status = 'invite_only' THEN
    RAISE EXCEPTION 'Registration is invite only';
  END IF;

  IF evt_status IN ('closed', 'sold_out') THEN
    RAISE EXCEPTION 'Registration is closed';
  END IF;

  IF cap IS NULL THEN
    NEW.status := COALESCE(NEW.status, 'registered');
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO reg_count
  FROM public.event_registrations
  WHERE event_id = NEW.event_id AND status = 'registered';

  IF reg_count >= cap THEN
    IF evt_status = 'waiting_list' THEN
      NEW.status := 'waiting_list';
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Event is at capacity';
  END IF;

  NEW.status := 'registered';
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "twofas mentors authenticated read active" ON public.twofas_mentors;

CREATE POLICY "twofas mentors admin or assigned read"
ON public.twofas_mentors
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.twofas_mentor_assignments a
    JOIN public.internship_applications ia ON ia.id = a.application_id
    WHERE a.mentor_id = twofas_mentors.id
      AND ia.user_id = auth.uid()
  )
);

REVOKE SELECT (contact_email, contact_phone, contact_name)
  ON public.market_vendors FROM anon;

DROP POLICY IF EXISTS "equipment-images public read"   ON storage.objects;
DROP POLICY IF EXISTS "event-images public read"       ON storage.objects;
DROP POLICY IF EXISTS "market-images public read"      ON storage.objects;
DROP POLICY IF EXISTS "partner-logos public read"      ON storage.objects;
DROP POLICY IF EXISTS "podcast-images public read"     ON storage.objects;
DROP POLICY IF EXISTS "program-images public read"     ON storage.objects;
DROP POLICY IF EXISTS "publication-images public read" ON storage.objects;
DROP POLICY IF EXISTS "publications public read"       ON storage.objects;

REVOKE EXECUTE ON FUNCTION public.enforce_event_capacity()                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_equipment_availability()            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_event_ticket_code()                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at()                         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()                            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_inquiries_public_insert_guard()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_validate_event_attendance_event()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_event_evaluation_response_privacy()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_inquiry_received()               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_twofas_application()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_event_registration()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_publication_added()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_equipment_request()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_notify_grant_deadline()                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_admin_notification(public.notification_type, text, text, text, public.notification_priority, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hash_evaluation_access_token(text)          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.event_demographic_rows(uuid)                FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.create_program_category(text)                        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_publication_category(text)                    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_event_gallery_cover(uuid, uuid)                  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_event_demographic_aggregates(uuid)               FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_multi_event_demographic_aggregates(uuid[])       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_my_attendance_evaluation_complete(uuid)         FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION public.upsert_my_participant_demographics(
  public.demographic_source_type, uuid, text, text, text, text, text, text, text,
  boolean, boolean, text, text, text, uuid, public.academic_level, boolean
) FROM PUBLIC, anon;
