-- Correct the existing public market record to match the project owner's name and photo.
UPDATE public.markets
SET name = 'Macon County Farmers Market',
    image_url = '/images/content/macon-county-farmers-market.jpg',
    metadata = COALESCE(metadata, '{}'::jsonb) - 'hero_image_url' - 'image_note'
WHERE id = 'afac7fee-a95c-45d2-a35b-6729c52e4321'
  AND name = 'Tuskegee Farmers Market';
