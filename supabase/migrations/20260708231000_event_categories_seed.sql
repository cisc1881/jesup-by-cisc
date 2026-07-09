-- Seed event categories for CISC Extension programming.

INSERT INTO public.event_categories (name, slug, sort_order) VALUES
  ('Workshop', 'workshop', 0),
  ('Conference', 'conference', 1),
  ('Training', 'training', 2),
  ('Academy', 'academy', 3),
  ('Community Event', 'community', 4),
  ('Field Demonstration', 'field-demo', 5)
ON CONFLICT (slug) DO NOTHING;
