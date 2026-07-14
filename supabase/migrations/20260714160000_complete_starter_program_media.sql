-- Keep the imported CISC fellowship visually complete with the same
-- AI-generated, locally hosted artwork used by the starter experience.
update public.programs
set
  cover_image_url = coalesce(cover_image_url, '/starter/community-extension.jpg'),
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'hero_image_url', coalesce(
      metadata ->> 'hero_image_url',
      '/starter/heroes/community-extension-hero.jpg'
    ),
    'image_note', coalesce(
      metadata ->> 'image_note',
      'AI-generated illustrative image'
    )
  )
where name = 'CISC HBCU Fellowship Program'
  and cover_image_url is null;
