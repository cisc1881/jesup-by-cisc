import { supabase } from "@/integrations/supabase/client";
import type { PublicationContentType } from "@/lib/publication-content-types";
import { publicationContentTypeLabel } from "@/lib/publication-content-types";

export const PUBLICATION_PDF_BUCKET = "publications";
export const PUBLICATION_COVER_BUCKET = "publication-images";

export type PublicationCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export type PublicationListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  author: string | null;
  publishedAt: string | null;
  categoryId: string | null;
  categoryName: string | null;
  contentType: PublicationContentType | null;
  contentTypeLabel: string;
  coverImageUrl: string | null;
  fileUrl: string | null;
  externalUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  tags: string[];
};

export type PublicationAttachment = {
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
  hrefParams?: Record<string, string>;
};

export type PublicationDetail = PublicationListItem & {
  programs: PublicationAttachment[];
  events: PublicationAttachment[];
  podcasts: PublicationAttachment[];
  metadata: Record<string, unknown>;
};

export type PublicationFormData = {
  slug: string;
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  categoryId: string;
  contentType: PublicationContentType | "";
  coverImageUrl: string;
  fileUrl: string;
  externalUrl: string;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  programIds: string[];
  eventIds: string[];
  podcastIds: string[];
};

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function uploadPublicationPdf(file: File) {
  const path = `files/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from(PUBLICATION_PDF_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(PUBLICATION_PDF_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPublicationCover(file: File) {
  const path = `covers/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from(PUBLICATION_COVER_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(PUBLICATION_COVER_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const listSelect = `
  id, slug, title, description, author, published_at, content_type, cover_image_url,
  file_url, external_url, is_featured, is_active, category_id,
  publication_categories ( id, name )
`;

function mapListRow(row: Record<string, unknown>, tags: string[] = []): PublicationListItem {
  const category = row.publication_categories as { id: string; name: string } | null | undefined;
  const contentType = (row.content_type as PublicationContentType | null) ?? null;
  return {
    id: row.id as string,
    slug: (row.slug as string) ?? (row.id as string),
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    author: (row.author as string | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
    categoryId: (row.category_id as string | null) ?? category?.id ?? null,
    categoryName: category?.name ?? (row.category as string | null) ?? null,
    contentType,
    contentTypeLabel: publicationContentTypeLabel(contentType),
    coverImageUrl: (row.cover_image_url as string | null) ?? null,
    fileUrl: (row.file_url as string | null) ?? null,
    externalUrl: (row.external_url as string | null) ?? null,
    isFeatured: row.is_featured as boolean,
    isActive: row.is_active as boolean,
    tags,
  };
}

async function fetchTagsForPublications(publicationIds: string[]) {
  if (publicationIds.length === 0) return new Map<string, string[]>();
  const { data, error } = await supabase
    .from("publication_tags")
    .select("publication_id, tag")
    .in("publication_id", publicationIds);
  if (error) throw error;
  const map = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = map.get(row.publication_id) ?? [];
    list.push(row.tag);
    map.set(row.publication_id, list);
  }
  return map;
}

export async function fetchPublications(options?: {
  activeOnly?: boolean;
  featuredOnly?: boolean;
  limit?: number;
}) {
  let query = supabase
    .from("publications")
    .select(listSelect)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("title", { ascending: true });

  if (options?.activeOnly !== false) query = query.eq("is_active", true);
  if (options?.featuredOnly) query = query.eq("is_featured", true);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  const tagMap = await fetchTagsForPublications(rows.map((r) => r.id));
  return rows.map((row) => mapListRow(row as Record<string, unknown>, tagMap.get(row.id) ?? []));
}

export async function fetchPublicationBySlug(slug: string): Promise<PublicationDetail | null> {
  const { data: row, error } = await supabase
    .from("publications")
    .select(`${listSelect}, metadata`)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!row) return null;

  const publicationId = row.id as string;
  const [tagsRes, programsRes, eventsRes, podcastsRes] = await Promise.all([
    supabase.from("publication_tags").select("tag").eq("publication_id", publicationId),
    supabase
      .from("program_publications")
      .select("sort_order, programs ( id, name, slug )")
      .eq("publication_id", publicationId)
      .order("sort_order"),
    supabase
      .from("publication_events")
      .select("sort_order, events ( id, title, starts_at )")
      .eq("publication_id", publicationId)
      .order("sort_order"),
    supabase
      .from("publication_podcast_episodes")
      .select("sort_order, podcast_episodes ( id, title, guest, slug )")
      .eq("publication_id", publicationId)
      .order("sort_order"),
  ]);

  for (const res of [tagsRes, programsRes, eventsRes, podcastsRes]) {
    if (res.error) throw res.error;
  }

  const base = mapListRow(
    row as Record<string, unknown>,
    (tagsRes.data ?? []).map((t) => t.tag),
  );

  return {
    ...base,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
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
    podcasts: (podcastsRes.data ?? []).map((item) => {
      const ep = item.podcast_episodes as { id: string; title: string; guest: string | null; slug: string };
      return {
        id: ep.id,
        title: ep.title,
        subtitle: ep.guest,
        href: "/podcasts/$slug",
        hrefParams: { slug: ep.slug },
      };
    }),
  };
}

export async function fetchPublicationCategories(): Promise<PublicationCategory[]> {
  const { data, error } = await supabase
    .from("publication_categories")
    .select("id, name, slug, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    sortOrder: c.sort_order,
  }));
}

export async function savePublicationCategory(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name is required");

  const { data, error } = await supabase.rpc("create_publication_category", { p_name: trimmed });
  if (error) {
    if (error.message.includes("duplicate key")) {
      throw new Error("A category with this name already exists");
    }
    throw error;
  }

  const row = data as { id: string; name: string; slug: string; sort_order: number };
  return { id: row.id, name: row.name, slug: row.slug, sortOrder: row.sort_order } satisfies PublicationCategory;
}

export async function fetchAdminPublications() {
  const { data, error } = await supabase
    .from("publications")
    .select(listSelect)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  const rows = data ?? [];
  const tagMap = await fetchTagsForPublications(rows.map((r) => r.id));
  return rows.map((row) => mapListRow(row as Record<string, unknown>, tagMap.get(row.id) ?? []));
}

export async function fetchAdminPublicationForm(publicationId: string): Promise<PublicationFormData> {
  const { data: row, error } = await supabase.from("publications").select("*").eq("id", publicationId).single();
  if (error) throw error;

  const [tagsRes, programsRes, eventsRes, podcastsRes] = await Promise.all([
    supabase.from("publication_tags").select("tag").eq("publication_id", publicationId),
    supabase.from("program_publications").select("program_id").eq("publication_id", publicationId),
    supabase.from("publication_events").select("event_id").eq("publication_id", publicationId),
    supabase.from("publication_podcast_episodes").select("podcast_episode_id").eq("publication_id", publicationId),
  ]);

  return {
    slug: row.slug ?? "",
    title: row.title,
    description: row.description ?? "",
    author: row.author ?? "",
    publishedAt: row.published_at ? row.published_at.slice(0, 10) : "",
    categoryId: row.category_id ?? "",
    contentType: (row.content_type as PublicationContentType | null) ?? "",
    coverImageUrl: row.cover_image_url ?? "",
    fileUrl: row.file_url ?? "",
    externalUrl: row.external_url ?? "",
    isActive: row.is_active ?? true,
    isFeatured: row.is_featured ?? false,
    tags: (tagsRes.data ?? []).map((t) => t.tag),
    programIds: (programsRes.data ?? []).map((r) => r.program_id),
    eventIds: (eventsRes.data ?? []).map((r) => r.event_id),
    podcastIds: (podcastsRes.data ?? []).map((r) => r.podcast_episode_id),
  };
}

async function replacePublicationRelations(publicationId: string, form: PublicationFormData) {
  await Promise.all([
    supabase.from("publication_tags").delete().eq("publication_id", publicationId),
    supabase.from("program_publications").delete().eq("publication_id", publicationId),
    supabase.from("publication_events").delete().eq("publication_id", publicationId),
    supabase.from("publication_podcast_episodes").delete().eq("publication_id", publicationId),
  ]);

  if (form.tags.length > 0) {
    const { error } = await supabase.from("publication_tags").insert(
      form.tags.map((tag) => ({ publication_id: publicationId, tag: tag.trim() })).filter((t) => t.tag),
    );
    if (error) throw error;
  }

  if (form.programIds.length > 0) {
    const { error } = await supabase.from("program_publications").insert(
      form.programIds.map((id, i) => ({ publication_id: publicationId, program_id: id, sort_order: i })),
    );
    if (error) throw error;
  }

  if (form.eventIds.length > 0) {
    const { error } = await supabase.from("publication_events").insert(
      form.eventIds.map((id, i) => ({ publication_id: publicationId, event_id: id, sort_order: i })),
    );
    if (error) throw error;
  }

  if (form.podcastIds.length > 0) {
    const { error } = await supabase.from("publication_podcast_episodes").insert(
      form.podcastIds.map((id, i) => ({ publication_id: publicationId, podcast_episode_id: id, sort_order: i })),
    );
    if (error) throw error;
  }
}

export async function savePublication(publicationId: string | null, form: PublicationFormData) {
  const payload = {
    slug: form.slug || slugify(form.title),
    title: form.title,
    description: form.description || null,
    author: form.author || null,
    published_at: form.publishedAt || null,
    category_id: form.categoryId || null,
    category: null,
    content_type: form.contentType || null,
    cover_image_url: form.coverImageUrl || null,
    file_url: form.fileUrl || null,
    external_url: form.externalUrl || null,
    is_active: form.isActive,
    is_featured: form.isFeatured,
  };

  if (publicationId) {
    const { error } = await supabase.from("publications").update(payload).eq("id", publicationId);
    if (error) throw error;
    await replacePublicationRelations(publicationId, form);
    return publicationId;
  }

  const { data, error } = await supabase.from("publications").insert(payload).select("id").single();
  if (error) throw error;
  await replacePublicationRelations(data.id, form);
  return data.id;
}

export async function deletePublication(publicationId: string) {
  const { error } = await supabase.from("publications").delete().eq("id", publicationId);
  if (error) throw error;
}

export const emptyPublicationForm = (): PublicationFormData => ({
  slug: "",
  title: "",
  description: "",
  author: "",
  publishedAt: "",
  categoryId: "",
  contentType: "",
  coverImageUrl: "",
  fileUrl: "",
  externalUrl: "",
  isActive: true,
  isFeatured: false,
  tags: [],
  programIds: [],
  eventIds: [],
  podcastIds: [],
});

export function filterPublications(
  publications: PublicationListItem[],
  search: string,
  categoryId: string | null,
  contentType: PublicationContentType | null,
) {
  const q = search.trim().toLowerCase();
  return publications.filter((pub) => {
    const matchesCategory = !categoryId || pub.categoryId === categoryId;
    const matchesType = !contentType || pub.contentType === contentType;
    const matchesSearch =
      !q ||
      [pub.title, pub.description, pub.author, pub.categoryName, ...pub.tags]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q));
    return matchesCategory && matchesType && matchesSearch;
  });
}
