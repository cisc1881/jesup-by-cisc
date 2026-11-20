-- Use the project owner's 2FAS artwork and the official Spotify show player.
INSERT INTO public.podcast_episodes (
  slug, title, description, category, cover_url, embed_url,
  is_published, is_featured, published_at
)
VALUES (
  '2fas-podcast',
  '2FAS Podcast',
  'Health, science, agriculture, and culture from Tuskegee University and the Carver Integrative Sustainability Center.',
  '2FAS',
  '/images/content/2fas-podcast.jpg',
  'https://open.spotify.com/embed/show/4BCy3DO6boEw4UBhM0Ykjh',
  true, true, NULL
)
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    cover_url = EXCLUDED.cover_url,
    embed_url = EXCLUDED.embed_url,
    is_published = true,
    is_featured = true,
    published_at = NULL;
