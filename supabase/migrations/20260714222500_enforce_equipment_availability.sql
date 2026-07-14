-- Enforce equipment inventory centrally. Client-side overlap checks cannot see
-- other users' reservations under RLS and are not safe under concurrent writes.

CREATE OR REPLACE FUNCTION public.enforce_equipment_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_reserved integer;
BEGIN
  IF NEW.quantity < 1 THEN
    RAISE EXCEPTION 'checkout quantity must be at least 1';
  END IF;

  IF NEW.return_date < NEW.checkout_date THEN
    RAISE EXCEPTION 'return date must be on or after checkout date';
  END IF;

  -- Serialize availability decisions for the same inventory item.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.equipment_id::text, 0));

  SELECT quantity_total
  INTO v_total
  FROM public.equipment
  WHERE id = NEW.equipment_id;

  IF v_total IS NULL THEN
    RAISE EXCEPTION 'equipment item does not exist';
  END IF;

  SELECT COALESCE(sum(quantity), 0)::integer
  INTO v_reserved
  FROM public.equipment_checkouts
  WHERE equipment_id = NEW.equipment_id
    AND status IN ('approved', 'checked_out')
    AND checkout_date <= NEW.return_date
    AND return_date >= NEW.checkout_date
    AND id IS DISTINCT FROM NEW.id;

  IF v_reserved + NEW.quantity > v_total THEN
    RAISE EXCEPTION 'not enough equipment available; % of % already reserved', v_reserved, v_total;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_equipment_availability() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_equipment_availability() TO service_role;

DROP TRIGGER IF EXISTS enforce_equipment_availability ON public.equipment_checkouts;
CREATE TRIGGER enforce_equipment_availability
  BEFORE INSERT OR UPDATE OF equipment_id, quantity, checkout_date, return_date, status
  ON public.equipment_checkouts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_equipment_availability();
