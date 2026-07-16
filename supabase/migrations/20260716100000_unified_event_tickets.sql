-- Unified JESUP/Eventbrite ticket identity and readable event ticket codes.
-- Existing ticket codes remain valid; the trigger only formats new registrations.

CREATE SEQUENCE IF NOT EXISTS public.event_ticket_number_seq START 1;

ALTER TABLE public.event_registrations
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS attendee_name text,
  ADD COLUMN IF NOT EXISTS attendee_email text,
  ADD COLUMN IF NOT EXISTS registration_source text NOT NULL DEFAULT 'jesup',
  ADD COLUMN IF NOT EXISTS external_registration_id text,
  ADD COLUMN IF NOT EXISTS external_barcode text;

ALTER TABLE public.event_registrations
  DROP CONSTRAINT IF EXISTS event_registrations_registration_source_check;
ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_registration_source_check
  CHECK (registration_source IN ('jesup', 'eventbrite'));

CREATE UNIQUE INDEX IF NOT EXISTS event_registrations_external_source_uidx
  ON public.event_registrations (registration_source, external_registration_id)
  WHERE external_registration_id IS NOT NULL;

-- Eventbrite is the payment system of record for paid-event capacity. Importing
-- its confirmed attendee ledger must not be rejected by JESUP's native capacity trigger.
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
BEGIN
  IF NEW.registration_source = 'eventbrite' THEN
    RETURN NEW;
  END IF;

  SELECT capacity, registration_status INTO cap, evt_status
  FROM public.events
  WHERE id = NEW.event_id;

  IF evt_status IN ('closed', 'sold_out') THEN
    RAISE EXCEPTION 'Registration is closed';
  END IF;

  IF cap IS NULL THEN
    NEW.status := 'registered';
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

CREATE OR REPLACE FUNCTION public.generate_event_ticket_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_starts_at timestamptz;
  v_clean text;
  v_words text[];
  v_prefix text;
  v_number bigint;
BEGIN
  IF NEW.ticket_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT title, starts_at INTO v_title, v_starts_at
  FROM public.events
  WHERE id = NEW.event_id;

  v_clean := upper(regexp_replace(coalesce(v_title, 'EVENT'), '[^A-Za-z0-9 ]', '', 'g'));
  v_words := regexp_split_to_array(trim(v_clean), '\\s+');

  IF coalesce(array_length(v_words, 1), 0) >= 3 THEN
    v_prefix := substr(v_words[1], 1, 1) || substr(v_words[2], 1, 1) || substr(v_words[3], 1, 1);
  ELSE
    v_prefix := substr(replace(v_clean, ' ', ''), 1, 3);
  END IF;

  v_prefix := rpad(coalesce(nullif(v_prefix, ''), 'EVT'), 3, 'X');
  v_number := nextval('public.event_ticket_number_seq');
  NEW.ticket_code := v_prefix || '-' || to_char(coalesce(v_starts_at, now()), 'YYYYMMDD') || '-' || lpad(v_number::text, 6, '0');
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_event_ticket_code() FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.generate_event_ticket_code() TO service_role;
REVOKE ALL ON FUNCTION public.enforce_event_capacity() FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.enforce_event_capacity() TO service_role;

-- External attendees do not have an auth user. Native registrants continue to
-- receive the existing in-app confirmation notification.
CREATE OR REPLACE FUNCTION public.trg_confirm_event_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

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

REVOKE ALL ON FUNCTION public.trg_confirm_event_registration() FROM PUBLIC, anon, authenticated;
GRANT ALL ON FUNCTION public.trg_confirm_event_registration() TO service_role;
