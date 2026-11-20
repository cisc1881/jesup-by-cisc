export const TWO_FAS_PODCAST_SLUG = "2fas-podcast";
export const TWO_FAS_PODCAST_IMAGE = "/images/content/2fas-podcast.jpg";
export const TWO_FAS_SPOTIFY_URL = "https://open.spotify.com/show/4BCy3DO6boEw4UBhM0Ykjh";
export const TWO_FAS_SPOTIFY_EMBED_URL =
  "https://open.spotify.com/embed/show/4BCy3DO6boEw4UBhM0Ykjh";

export function podcastCoverUrl(slug: string, existing: string | null): string | null {
  return slug === TWO_FAS_PODCAST_SLUG ? TWO_FAS_PODCAST_IMAGE : existing;
}

export function podcastEmbedUrl(slug: string, existing: string | null): string | null {
  return slug === TWO_FAS_PODCAST_SLUG ? TWO_FAS_SPOTIFY_EMBED_URL : existing;
}
