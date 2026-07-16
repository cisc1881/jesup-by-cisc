-- Operational audit trail for equipment approvals, pickup, and returns.
ALTER TABLE public.equipment_checkouts
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS condition_out TEXT,
  ADD COLUMN IF NOT EXISTS condition_in TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.track_equipment_checkout_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.processed_by := auth.uid();
    IF NEW.status = 'approved' AND NEW.approved_at IS NULL THEN
      NEW.approved_at := now();
    ELSIF NEW.status = 'checked_out' AND NEW.checked_out_at IS NULL THEN
      NEW.checked_out_at := now();
    ELSIF NEW.status = 'returned' AND NEW.returned_at IS NULL THEN
      NEW.returned_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.track_equipment_checkout_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_equipment_checkout_status() TO service_role;

DROP TRIGGER IF EXISTS track_equipment_checkout_status ON public.equipment_checkouts;
CREATE TRIGGER track_equipment_checkout_status
  BEFORE UPDATE OF status ON public.equipment_checkouts
  FOR EACH ROW EXECUTE FUNCTION public.track_equipment_checkout_status();
