-- Sprint 9 Phase 9A: inquiry notification trigger (separate transaction after enum extensions)

CREATE OR REPLACE FUNCTION public.trg_notify_inquiry_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_admin_notification(
    'inquiry_received',
    'New public inquiry',
    format(
      '%s %s submitted a %s inquiry.',
      NEW.first_name,
      NEW.last_name,
      replace(NEW.inquiry_type::text, '_', ' ')
    ),
    '/admin/inquiries',
    'normal',
    'inquiry',
    NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_inquiry_received ON public.inquiries;
CREATE TRIGGER notify_inquiry_received
  AFTER INSERT ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.trg_notify_inquiry_received();
