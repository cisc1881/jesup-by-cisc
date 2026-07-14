-- Official Tuskegee University sender identity for JESUP communications.

INSERT INTO public.platform_settings (key, value)
VALUES (
  'email',
  jsonb_build_object(
    'fromName', 'JESUP by CISC',
    'fromAddress', 'cisc@tuskegee.edu'
  )
)
ON CONFLICT (key) DO UPDATE
SET value = COALESCE(public.platform_settings.value, '{}'::jsonb)
  || jsonb_build_object(
    'fromName', 'JESUP by CISC',
    'fromAddress', 'cisc@tuskegee.edu'
  ),
  updated_at = now();
