import { supabase } from "@/integrations/supabase/client";

export const NEWS_IMAGES_BUCKET = "news-images";

export type NewsListItem = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  author: string | null;
  category: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  readingTimeMinutes: number | null;
  tags: string[];
};

export type NewsAttachment = {
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
  hrefParams?: Record<string, string>;
};

export type NewsDetail = NewsListItem & {
  contentHtml: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  programs: NewsAttachment[];
  events: NewsAttachment[];
  publications: NewsAttachment[];
  partners: NewsAttachment[];
};

export type NewsFormData = {
  slug: string;
  title: string;
  summary: string;
  contentHtml: string;
  author: string;
  category: string;
  coverImageUrl: string;
  publishedAt: string;
  isPublished: boolean;
  isFeatured: boolean;
  readingTimeMinutes: string;
  seoTitle: string;
  seoDescription: string;
  sortOrder: number;
  tags: string[];
  programIds: string[];
  eventIds: string[];
  publicationIds: string[];
  partnerIds: string[];
};

const listSelect = `
  id, slug, title, summary, author, category, cover_image_url, published_at,
  is_published, is_featured, reading_time_minutes
`;

function mapListRow(row: Record<string, unknown>, tags: string[] = []): NewsListItem {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    summary: (row.summary as string | null) ?? null,
    author: (row.author as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    coverImageUrl: (row.cover_image_url as string | null) ?? null,
    publishedAt: (row.published_at as string | null) ?? null,
    isPublished: row.is_published as boolean,
    isFeatured: (row.is_featured as boolean) ?? false,
    readingTimeMinutes: (row.reading_time_minutes as number | null) ?? null,
    tags,
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function estimateReadingMinutes(html: string) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 1;
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function uploadNewsCover(file: File) {
  const path = `covers/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from(NEWS_IMAGES_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(NEWS_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function fetchTagsForArticles(articleIds: string[]) {
  if (articleIds.length === 0) return new Map<string, string[]>();
  const { data, error } = await supabase
    .from("news_tags")
    .select("news_article_id, tag")
    .in("news_article_id", articleIds);
  if (error) throw error;
  const map = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = map.get(row.news_article_id) ?? [];
    list.push(row.tag);
    map.set(row.news_article_id, list);
  }
  return map;
}

export async function fetchNewsArticles(options?: {
  publishedOnly?: boolean;
  featuredOnly?: boolean;
  limit?: number;
}) {
  let query = supabase
    .from("news_articles")
    .select(listSelect)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("title");

  if (options?.publishedOnly !== false) query = query.eq("is_published", true);
  if (options?.featuredOnly) query = query.eq("is_featured", true);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  const tagMap = await fetchTagsForArticles(rows.map((r) => r.id));
  return rows.map((row) => mapListRow(row as Record<string, unknown>, tagMap.get(row.id) ?? []));
}

export async function fetchFeaturedNewsArticle(): Promise<NewsListItem | null> {
  const featured = await fetchNewsArticles({ featuredOnly: true, limit: 1 });
  if (featured[0]) return featured[0];
  const latest = await fetchNewsArticles({ limit: 1 });
  return latest[0] ?? null;
}

export async function fetchNewsCategoriesFromData(articles: NewsListItem[]) {
  const set = new Set<string>();
  for (const article of articles) {
    if (article.category) set.add(article.category);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function filterNewsArticles(articles: NewsListItem[], search: string, category: string | null) {
  const q = search.trim().toLowerCase();
  return articles.filter((article) => {
    if (category && category !== "All" && article.category !== category) return false;
    if (!q) return true;
    return [article.title, article.summary, article.author, article.category, ...article.tags]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(q));
  });
}

export async function fetchNewsBySlug(slug: string): Promise<NewsDetail | null> {
  const { data: row, error } = await supabase
    .from("news_articles")
    .select(`${listSelect}, content_html, seo_title, seo_description`)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const articleId = row.id as string;
  const [tagsRes, programsRes, eventsRes, publicationsRes, partnersRes] = await Promise.all([
    supabase.from("news_tags").select("tag").eq("news_article_id", articleId),
    supabase
      .from("news_programs")
      .select("sort_order, programs ( id, name, slug )")
      .eq("news_article_id", articleId)
      .order("sort_order"),
    supabase
      .from("news_events")
      .select("sort_order, events ( id, title, starts_at, slug )")
      .eq("news_article_id", articleId)
      .order("sort_order"),
    supabase
      .from("news_publications")
      .select("sort_order, publications ( id, title, slug )")
      .eq("news_article_id", articleId)
      .order("sort_order"),
    supabase
      .from("news_partners")
      .select("sort_order, partners ( id, name, slug )")
      .eq("news_article_id", articleId)
      .order("sort_order"),
  ]);

  for (const res of [tagsRes, programsRes, eventsRes, publicationsRes, partnersRes]) {
    if (res.error) throw res.error;
  }

  const base = mapListRow(row as Record<string, unknown>, (tagsRes.data ?? []).map((t) => t.tag));
  return {
    ...base,
    contentHtml: (row.content_html as string | null) ?? null,
    seoTitle: (row.seo_title as string | null) ?? null,
    seoDescription: (row.seo_description as string | null) ?? null,
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
        hrefParams: { id: event.slug ?? event.id },
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
    partners: (partnersRes.data ?? []).map((item) => {
      const partner = item.partners as { id: string; name: string; slug: string };
      return {
        id: partner.id,
        title: partner.name,
        href: "/partners/$slug",
        hrefParams: { slug: partner.slug },
      };
    }),
  };
}

export async function fetchAdminNewsArticles() {
  const { data, error } = await supabase
    .from("news_articles")
    .select(listSelect)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  const rows = data ?? [];
  const tagMap = await fetchTagsForArticles(rows.map((r) => r.id));
  return rows.map((row) => mapListRow(row as Record<string, unknown>, tagMap.get(row.id) ?? []));
}

export async function fetchAdminNewsForm(articleId: string): Promise<NewsFormData> {
  const { data: row, error } = await supabase.from("news_articles").select("*").eq("id", articleId).single();
  if (error) throw error;

  const [tagsRes, programsRes, eventsRes, publicationsRes, partnersRes] = await Promise.all([
    supabase.from("news_tags").select("tag").eq("news_article_id", articleId),
    supabase.from("news_programs").select("program_id").eq("news_article_id", articleId),
    supabase.from("news_events").select("event_id").eq("news_article_id", articleId),
    supabase.from("news_publications").select("publication_id").eq("news_article_id", articleId),
    supabase.from("news_partners").select("partner_id").eq("news_article_id", articleId),
  ]);

  return {
    slug: row.slug ?? "",
    title: row.title,
    summary: row.summary ?? "",
    contentHtml: row.content_html ?? "",
    author: row.author ?? "",
    category: row.category ?? "",
    coverImageUrl: row.cover_image_url ?? "",
    publishedAt: row.published_at ? String(row.published_at).slice(0, 16) : "",
    isPublished: row.is_published ?? false,
    isFeatured: row.is_featured ?? false,
    readingTimeMinutes: row.reading_time_minutes != null ? String(row.reading_time_minutes) : "",
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    sortOrder: row.sort_order ?? 0,
    tags: (tagsRes.data ?? []).map((t) => t.tag),
    programIds: (programsRes.data ?? []).map((r) => r.program_id),
    eventIds: (eventsRes.data ?? []).map((r) => r.event_id),
    publicationIds: (publicationsRes.data ?? []).map((r) => r.publication_id),
    partnerIds: (partnersRes.data ?? []).map((r) => r.partner_id),
  };
}

export function emptyNewsForm(): NewsFormData {
  return {
    slug: "",
    title: "",
    summary: "",
    contentHtml: "",
    author: "",
    category: "",
    coverImageUrl: "",
    publishedAt: "",
    isPublished: false,
    isFeatured: false,
    readingTimeMinutes: "",
    seoTitle: "",
    seoDescription: "",
    sortOrder: 0,
    tags: [],
    programIds: [],
    eventIds: [],
    publicationIds: [],
    partnerIds: [],
  };
}

async function clearOtherFeatured(excludeId?: string) {
  let query = supabase.from("news_articles").update({ is_featured: false }).eq("is_featured", true);
  if (excludeId) query = query.neq("id", excludeId);
  const { error } = await query;
  if (error) throw error;
}

async function replaceNewsRelations(articleId: string, form: NewsFormData) {
  await Promise.all([
    supabase.from("news_tags").delete().eq("news_article_id", articleId),
    supabase.from("news_programs").delete().eq("news_article_id", articleId),
    supabase.from("news_events").delete().eq("news_article_id", articleId),
    supabase.from("news_publications").delete().eq("news_article_id", articleId),
    supabase.from("news_partners").delete().eq("news_article_id", articleId),
  ]);

  if (form.tags.length) {
    const { error } = await supabase.from("news_tags").insert(
      form.tags.map((tag) => ({ news_article_id: articleId, tag: tag.trim() })).filter((t) => t.tag),
    );
    if (error) throw error;
  }
  if (form.programIds.length) {
    const { error } = await supabase.from("news_programs").insert(
      form.programIds.map((programId, i) => ({ news_article_id: articleId, program_id: programId, sort_order: i })),
    );
    if (error) throw error;
  }
  if (form.eventIds.length) {
    const { error } = await supabase.from("news_events").insert(
      form.eventIds.map((eventId, i) => ({ news_article_id: articleId, event_id: eventId, sort_order: i })),
    );
    if (error) throw error;
  }
  if (form.publicationIds.length) {
    const { error } = await supabase.from("news_publications").insert(
      form.publicationIds.map((publicationId, i) => ({
        news_article_id: articleId,
        publication_id: publicationId,
        sort_order: i,
      })),
    );
    if (error) throw error;
  }
  if (form.partnerIds.length) {
    const { error } = await supabase.from("news_partners").insert(
      form.partnerIds.map((partnerId, i) => ({ news_article_id: articleId, partner_id: partnerId, sort_order: i })),
    );
    if (error) throw error;
  }
}

export async function saveNewsArticle(articleId: string | null, form: NewsFormData) {
  const slug = form.slug.trim() || slugify(form.title);
  if (!form.title.trim()) throw new Error("Title is required");

  if (form.isFeatured) {
    await clearOtherFeatured(articleId ?? undefined);
  }

  const readingTime = form.readingTimeMinutes
    ? Number(form.readingTimeMinutes)
    : estimateReadingMinutes(form.contentHtml);

  const payload = {
    slug,
    title: form.title.trim(),
    summary: form.summary.trim() || null,
    content_html: form.contentHtml.trim() || null,
    author: form.author.trim() || null,
    category: form.category || null,
    cover_image_url: form.coverImageUrl.trim() || null,
    published_at: form.publishedAt || null,
    is_published: form.isPublished,
    is_featured: form.isFeatured,
    reading_time_minutes: readingTime,
    seo_title: form.seoTitle.trim() || null,
    seo_description: form.seoDescription.trim() || null,
    sort_order: Number(form.sortOrder) || 0,
  };

  let id = articleId;
  if (articleId) {
    const { error } = await supabase.from("news_articles").update(payload).eq("id", articleId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from("news_articles").insert(payload).select("id").single();
    if (error) throw error;
    id = data.id as string;
  }

  await replaceNewsRelations(id!, form);
  return id!;
}

export async function deleteNewsArticle(articleId: string) {
  const { error } = await supabase.from("news_articles").delete().eq("id", articleId);
  if (error) throw error;
}
