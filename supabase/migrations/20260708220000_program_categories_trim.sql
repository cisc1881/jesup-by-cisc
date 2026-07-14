-- Trim program categories to Education, Youth, Research.

INSERT INTO public.program_categories (name, slug, sort_order)
VALUES
  ('Education', 'education', 1),
  ('Youth', 'youth', 2),
  ('Research', 'research', 3)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order;

DELETE FROM public.program_categories
WHERE slug NOT IN ('education', 'youth', 'research');
