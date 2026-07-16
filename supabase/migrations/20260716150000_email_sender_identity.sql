-- Temporary sender identity approved for JESUP until Tuskegee provides
-- access to verify cisc@tuskegee.edu. The public app continues to display the
-- CISC contact address; this setting is used only in outbound email headers.
INSERT INTO public.platform_settings (key, value)
VALUES (
  'email',
  jsonb_build_object(
    'fromName', 'JESUP by CISC',
    'fromAddress', 'info@accessfarmtotable.com'
  )
)
ON CONFLICT (key) DO UPDATE
SET value = COALESCE(public.platform_settings.value, '{}'::jsonb)
  || jsonb_build_object(
    'fromName', 'JESUP by CISC',
    'fromAddress', 'info@accessfarmtotable.com'
  ),
  updated_at = now();
