import { supabase } from "@/integrations/supabase/client";

export const PODCAST_IMAGES_BUCKET = "podcast-images";

export type PodcastListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  guest: string | null;
  category: string | null;
  coverUrl: string | null;
  audioUrl: string | null;
  embedUrl: string | null;
  durationSeconds: number | null;
  publishedAt: string | null;
  isPublished: boolean;
  isFeatured: boolean;
};

export type PodcastAttachment = {
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
  hrefParams?: Record<string, string>;
};

export type PodcastDetail = PodcastListItem & {
  programs: PodcastAttachment[];
  events: PodcastAttachment[];
  publications: PodcastAttachment[];
};

export type PodcastFormData = {
  slug: string;
  title: string;
  guest: string;
  description: string;
  category: string;
  coverUrl: string;
  audioUrl: string;
  embedUrl: string;
  durationSeconds: string;
  publishedAt: string;
  isPublished: boolean;
  isFeatured: boolean;
};

const listSelect =
  "id, slug, title, description, guest, category, cover_url, audio_url, embed_url, duration_seconds, published_at, is_published, is_featured";

function mapRow(row: Record<string, unknown>): PodcastListItem {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    guest: (row.guest as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    coverUrl: (row.cover_url as string | null) ?? null,
    audioUrl: (row.audio_url as string | null) ?? null,
    embedUrl: (row.embed_url as string | null) ?? null,
    durationSeconds: (row.duration_seconds as number | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
    isPublished: row.is_published as boolean,
    isFeatured: (row.is_featured as boolean) ?? false,
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadPodcastCover(file: File) {
  const path = `covers/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from(PODCAST_IMAGES_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(PODCAST_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchPodcasts(options?: {
  publishedOnly?: boolean;
  featuredOnly?: boolean;
  limit?: number;
}) {
  let query = supabase
    .from("podcast_episodes")
    .select(listSelect)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("title", { ascending: true });

  if (options?.publishedOnly !== false) query = query.eq("is_published", true);
  if (options?.featuredOnly) query = query.eq("is_featured", true);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function fetchFeaturedPodcastEpisode(): Promise<PodcastListItem | null> {
  const featured = await fetchPodcasts({ featuredOnly: true, limit: 1 });
  if (featured[0]) return featured[0];
  const latest = await fetchPodcasts({ limit: 1 });
  return latest[0] ?? null;
}

export async function fetchPodcastCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("podcast_episodes")
    .select("category")
    .eq("is_published", true)
    .not("category", "is", null);
  if (error) throw error;
  const set = new Set<string>();
  for (const row of data ?? []) {
    const cat = row.category?.trim();
    if (cat) set.add(cat);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export async function fetchPodcastBySlug(slug: string): Promise<PodcastDetail | null> {
  const { data: row, error } = await supabase
    .from("podcast_episodes")
    .select(listSelect)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const episodeId = row.id as string;
  const [programsRes, eventsRes, publicationsRes] = await Promise.all([
    supabase
      .from("program_podcast_episodes")
      .select("sort_order, programs ( id, name, slug )")
      .eq("podcast_episode_id", episodeId)
      .order("sort_order"),
    supabase
      .from("event_podcast_episodes")
      .select("sort_order, events ( id, title, starts_at )")
      .eq("podcast_episode_id", episodeId)
      .order("sort_order"),
    supabase
      .from("publication_podcast_episodes")
      .select("sort_order, publications ( id, title, slug )")
      .eq("podcast_episode_id", episodeId)
      .order("sort_order"),
  ]);

  for (const res of [programsRes, eventsRes, publicationsRes]) {
    if (res.error) throw res.error;
  }

  return {
    ...mapRow(row as Record<string, unknown>),
    programs: (programsRes.data ?? []).map((item) => {
      const program = item.programs as { id: string; name: string; slug: string };
      return {
        id: program.id,
        title: program.name,
        href: "/programs/$slug",
        hrefParams: { slug: program.slug },
      };
    }),
    events: (eventsRes.data ?? []).map((item) => {
      const event = item.events as { id: string; title: string; starts_at: string };
      return {
        id: event.id,
        title: event.title,
        subtitle: event.starts_at,
        href: "/events/$id",
        hrefParams: { id: event.id },
      };
    }),
    publications: (publicationsRes.data ?? []).map((item) => {
      const pub = item.publications as { id: string; title: string; slug: string };
      return {
        id: pub.id,
        title: pub.title,
        href: "/publications/$slug",
        hrefParams: { slug: pub.slug },
      };
    }),
  };
}

export function filterPodcasts(episodes: PodcastListItem[], search: string, category: string | null) {
  const q = search.trim().toLowerCase();
  return episodes.filter((ep) => {
    if (category && ep.category !== category) return false;
    if (!q) return true;
    return [ep.title, ep.description, ep.guest, ep.category]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(q));
  });
}

export async function fetchAdminPodcasts() {
  const { data, error } = await supabase
    .from("podcast_episodes")
    .select(listSelect)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function fetchAdminPodcastForm(episodeId: string): Promise<PodcastFormData> {
  const { data: row, error } = await supabase.from("podcast_episodes").select("*").eq("id", episodeId).single();
  if (error) throw error;
  return mapFormRow(row);
}

function mapFormRow(row: Record<string, unknown>): PodcastFormData {
  return {
    slug: (row.slug as string) ?? "",
    title: row.title as string,
    guest: (row.guest as string | null) ?? "",
    description: (row.description as string | null) ?? "",
    category: (row.category as string | null) ?? "",
    coverUrl: (row.cover_url as string | null) ?? "",
    audioUrl: (row.audio_url as string | null) ?? "",
    embedUrl: (row.embed_url as string | null) ?? "",
    durationSeconds: row.duration_seconds != null ? String(row.duration_seconds) : "",
    publishedAt: row.published_at ? String(row.published_at).slice(0, 16) : "",
    isPublished: (row.is_published as boolean) ?? true,
    isFeatured: (row.is_featured as boolean) ?? false,
  };
}

export function emptyPodcastForm(): PodcastFormData {
  return {
    slug: "",
    title: "",
    guest: "",
    description: "",
    category: "",
    coverUrl: "",
    audioUrl: "",
    embedUrl: "",
    durationSeconds: "",
    publishedAt: "",
    isPublished: true,
    isFeatured: false,
  };
}

async function clearOtherFeatured(excludeId?: string) {
  let query = supabase.from("podcast_episodes").update({ is_featured: false }).eq("is_featured", true);
  if (excludeId) query = query.neq("id", excludeId);
  const { error } = await query;
  if (error) throw error;
}

export async function savePodcast(episodeId: string | null, form: PodcastFormData) {
  const slug = form.slug.trim() || slugify(form.title);
  if (!form.title.trim()) throw new Error("Title is required");

  const payload = {
    slug,
    title: form.title.trim(),
    guest: form.guest.trim() || null,
    description: form.description.trim() || null,
    category: form.category.trim() || null,
    cover_url: form.coverUrl.trim() || null,
    audio_url: form.audioUrl.trim() || null,
    embed_url: form.embedUrl.trim() || null,
    duration_seconds: form.durationSeconds ? Number(form.durationSeconds) : null,
    published_at: form.publishedAt || null,
    is_published: form.isPublished,
    is_featured: form.isFeatured,
  };

  if (form.isFeatured) {
    await clearOtherFeatured(episodeId ?? undefined);
  }

  if (episodeId) {
    const { error } = await supabase.from("podcast_episodes").update(payload).eq("id", episodeId);
    if (error) throw error;
    return episodeId;
  }

  const { data, error } = await supabase.from("podcast_episodes").insert(payload).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function deletePodcast(episodeId: string) {
  const { error } = await supabase.from("podcast_episodes").delete().eq("id", episodeId);
  if (error) throw error;
}
