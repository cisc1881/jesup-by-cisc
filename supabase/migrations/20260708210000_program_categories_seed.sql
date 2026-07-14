-- Seed default program categories for JESUP Programs filters.

INSERT INTO public.program_categories (name, slug, sort_order)
VALUES
  ('Education', 'education', 1),
  ('Youth', 'youth', 2),
  ('Research', 'research', 3)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order;

-- Remove categories outside the active JESUP set (programs keep category_id = NULL).
DELETE FROM public.program_categories
WHERE slug NOT IN ('education', 'youth', 'research');
