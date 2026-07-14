-- Podcast module: featured flag + embed URL for players

ALTER TABLE public.podcast_episodes
  ADD COLUMN IF NOT EXISTS embed_url TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_podcast_episodes_featured
  ON public.podcast_episodes (is_featured, published_at DESC)
  WHERE is_published = true AND is_featured = true;

COMMENT ON COLUMN public.podcast_episodes.embed_url IS 'Iframe embed URL (Spotify, Apple Podcasts, etc.)';
COMMENT ON COLUMN public.podcast_episodes.is_featured IS 'When true, episode is prioritized on Home and podcast index';
