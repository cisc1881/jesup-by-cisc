-- Universal internship audiences and verified 1890 network opportunities.
ALTER TABLE public.internships
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.internships
SET metadata = jsonb_build_object(
  'network_wide', false,
  'institution_ids', ARRAY[(SELECT id::text FROM public.institutions WHERE slug = 'tuskegee-university' LIMIT 1)],
  'institution_slugs', ARRAY['tuskegee-university']
)
WHERE is_2fas = true;

INSERT INTO public.events
  (slug, title, description, starts_at, ends_at, location, external_url, metadata, status, is_active, is_featured, registration_open, registration_status, timezone)
VALUES
  ('2026-southern-region-program-leadership-network', '2026 Southern Region Program Leadership Network Meeting', 'The 2026 SR-PLN, AEA and ASRED Joint Meeting for Extension and program leaders across the Southern Region.', '2026-08-17T09:00:00-05:00', '2026-08-20T17:00:00-05:00', 'New Orleans, Louisiana', 'http://srpln.msstate.edu/pln/2026_srpln_conference.html', '{"network_wide":true,"organization":"1890 AEA","source":"official"}'::jsonb, 'published', true, true, false, 'closed', 'America/Chicago'),
  ('2026-national-goat-consortium', '2026 National Goat Consortium', 'A national conference connecting goat producers, researchers, Extension professionals and agricultural leaders.', '2026-09-28T09:00:00-05:00', '2026-09-30T17:00:00-05:00', 'Edmond & Langston, Oklahoma', 'https://ngcgoats.wixsite.com/1890ngc/copy-of-conference-information', '{"network_wide":true,"organization":"1890 AEA","source":"official"}'::jsonb, 'published', true, true, false, 'closed', 'America/Chicago'),
  ('2026-aplu-annual-meeting', '2026 APLU Annual Meeting', 'The annual gathering of public and land-grant university leaders, partners and stakeholders.', '2026-11-15T09:00:00-06:00', '2026-11-17T17:00:00-06:00', 'San Antonio, Texas', 'https://web.cvent.com/event/d88e6859-787f-4144-adb9-4090059bc5da/summary?RefId=standard+link+', '{"network_wide":true,"organization":"APLU","source":"official"}'::jsonb, 'published', true, false, false, 'closed', 'America/Chicago'),
  ('2026-ace-level-up-virtual-conference', '2026 Association for Communication Excellence Level Up Virtual Conference', 'A virtual professional-development conference for communicators serving agriculture, natural resources, life and human sciences.', '2026-11-18T13:00:00-05:00', '2026-11-19T17:00:00-05:00', 'Virtual', 'https://aceweb.org/Fall-Virtual-Conference', '{"network_wide":true,"organization":"ACE","source":"official","virtual":true}'::jsonb, 'published', true, false, false, 'closed', 'America/New_York'),
  ('ard-research-symposium-recap-2026', '22nd ARD Research Symposium', 'The Association of 1890 Research Directors symposium showcasing research, student achievement, innovation and collaboration across the 1890 land-grant network.', '2026-03-28T09:00:00-05:00', '2026-03-31T17:00:00-05:00', 'Hyatt Regency New Orleans, New Orleans, Louisiana', 'https://wwwcp.umes.edu/ard/1890symposium/', '{"network_wide":true,"organization":"1890 ARD","source":"official"}'::jsonb, 'published', true, false, false, 'closed', 'America/Chicago')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  location = EXCLUDED.location,
  external_url = EXCLUDED.external_url,
  metadata = EXCLUDED.metadata,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active,
  timezone = EXCLUDED.timezone,
  updated_at = now();

INSERT INTO public.grants (title, funder, description, url)
SELECT 'Grants and Funding Opportunities', 'Foundation for Food & Agriculture Research',
       'Open competitive funding opportunities supporting science and innovation in food and agriculture.',
       'https://foundationfar.org/grants-funding/'
WHERE NOT EXISTS (
  SELECT 1 FROM public.grants WHERE url = 'https://foundationfar.org/grants-funding/'
);
