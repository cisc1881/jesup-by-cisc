import { supabase } from "@/integrations/supabase/client";

export const PROGRAM_IMAGES_BUCKET = "program-images";

export type ProgramCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export type ProgramGalleryImage = {
  id?: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
};

export type ProgramListItem = {
  id: string;
  slug: string;
  name: string;
  short: string | null;
  tagline: string | null;
  coverImageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  websiteUrl: string | null;
  registrationUrl: string | null;
  eventCount: number;
  publicationCount: number;
  podcastCount: number;
  partnerCount: number;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type ProgramAttachment = {
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
  hrefParams?: Record<string, string>;
};

export type ProgramDetail = ProgramListItem & {
  logoUrl: string | null;
  descriptionHtml: string | null;
  objectivesHtml: string | null;
  programDirector: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  registrationUrl: string | null;
  gallery: ProgramGalleryImage[];
  publications: ProgramAttachment[];
  podcasts: ProgramAttachment[];
  events: ProgramAttachment[];
  partners: ProgramAttachment[];
  grants: ProgramAttachment[];
  metadata: Record<string, unknown>;
};

export type ProgramFormData = {
  slug: string;
  name: string;
  short: string;
  tagline: string;
  descriptionHtml: string;
  objectivesHtml: string;
  coverImageUrl: string;
  logoUrl: string;
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  programDirector: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  registrationUrl: string;
  gallery: ProgramGalleryImage[];
  publicationIds: string[];
  podcastIds: string[];
  eventIds: string[];
  partnerIds: string[];
  grantIds: string[];
};

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function uploadProgramImage(file: File, prefix = "covers") {
  const path = `${prefix}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from(PROGRAM_IMAGES_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(PROGRAM_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function relationCount(value: unknown) {
  const row = Array.isArray(value) ? value[0] : value;
  return typeof row === "object" && row !== null && "count" in row ? Number((row as { count: number }).count) : 0;
}

function mapListRow(row: Record<string, unknown>): ProgramListItem {
  const category = row.program_categories as { id: string; name: string; slug: string } | null | undefined;
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    short: (row.short as string | null) ?? null,
    tagline: (row.tagline as string | null) ?? null,
    coverImageUrl: (row.cover_image_url as string | null) ?? null,
    categoryId: (row.category_id as string | null) ?? category?.id ?? null,
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    websiteUrl: (row.website_url as string | null) ?? null,
    registrationUrl: (row.registration_url as string | null) ?? null,
    eventCount: relationCount(row.program_events),
    publicationCount: relationCount(row.program_publications),
    podcastCount: relationCount(row.program_podcast_episodes),
    partnerCount: relationCount(row.program_partners),
    isFeatured: row.is_featured as boolean,
    isActive: row.is_active as boolean,
    sortOrder: row.sort_order as number,
  };
}

const programListSelect = `
  id, slug, name, short, tagline, cover_image_url, category_id, is_featured, is_active, sort_order,
  website_url, registration_url,
  program_categories ( id, name, slug ),
  program_events ( count ),
  program_publications ( count ),
  program_podcast_episodes ( count ),
  program_partners ( count )
`;

const programDetailSelect = `
  ${programListSelect},
  logo_url, description_html, objectives_html, program_director,
  contact_person, contact_email, contact_phone, website_url, registration_url, metadata
`;

export async function fetchPrograms(options?: { activeOnly?: boolean; featuredOnly?: boolean; limit?: number }) {
  let query = supabase
    .from("programs")
    .select(programListSelect)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (options?.activeOnly !== false) query = query.eq("is_active", true);
  if (options?.featuredOnly) query = query.eq("is_featured", true);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapListRow(row as Record<string, unknown>));
}

export async function fetchFeaturedProgram(): Promise<ProgramListItem | null> {
  const programs = await fetchPrograms({ featuredOnly: true, limit: 1 });
  return programs[0] ?? null;
}

export async function fetchProgramBySlug(slug: string): Promise<ProgramDetail | null> {
  const { data: program, error } = await supabase
    .from("programs")
    .select(programDetailSelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!program) return null;

  const programId = program.id as string;

  const [galleryRes, pubsRes, podsRes, eventsRes, partnersRes, grantsRes] = await Promise.all([
    supabase
      .from("program_images")
      .select("id, image_url, caption, sort_order")
      .eq("program_id", programId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("program_publications")
      .select("sort_order, publications ( id, title, slug, publication_categories ( name ) )")
      .eq("program_id", programId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("program_podcast_episodes")
      .select("sort_order, podcast_episodes ( id, title, slug, guest )")
      .eq("program_id", programId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("program_events")
      .select("sort_order, events ( id, title, starts_at )")
      .eq("program_id", programId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("program_partners")
      .select("sort_order, partners ( id, name, slug )")
      .eq("program_id", programId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("program_grants")
      .select("sort_order, grants ( id, title, funder, url )")
      .eq("program_id", programId)
      .order("sort_order", { ascending: true }),
  ]);

  for (const res of [galleryRes, pubsRes, podsRes, eventsRes, partnersRes, grantsRes]) {
    if (res.error) throw res.error;
  }

  const base = mapListRow(program as Record<string, unknown>);

  return {
    ...base,
    logoUrl: (program.logo_url as string | null) ?? null,
    descriptionHtml: (program.description_html as string | null) ?? null,
    objectivesHtml: (program.objectives_html as string | null) ?? null,
    programDirector: (program.program_director as string | null) ?? null,
    contactPerson: (program.contact_person as string | null) ?? null,
    contactEmail: (program.contact_email as string | null) ?? null,
    contactPhone: (program.contact_phone as string | null) ?? null,
    websiteUrl: (program.website_url as string | null) ?? null,
    registrationUrl: (program.registration_url as string | null) ?? null,
    metadata: (program.metadata as Record<string, unknown>) ?? {},
    gallery: (galleryRes.data ?? []).map((g) => ({
      id: g.id,
      imageUrl: g.image_url,
      caption: g.caption,
      sortOrder: g.sort_order,
    })),
    publications: (pubsRes.data ?? []).map((row) => {
      const pub = row.publications as {
        id: string;
        title: string;
        slug: string;
        publication_categories: { name: string } | null;
      };
      return {
        id: pub.id,
        title: pub.title,
        subtitle: pub.publication_categories?.name ?? null,
        href: "/publications/$slug",
        hrefParams: { slug: pub.slug },
      };
    }),
    podcasts: (podsRes.data ?? []).map((row) => {
      const ep = row.podcast_episodes as { id: string; title: string; guest: string | null; slug: string };
      return {
        id: ep.id,
        title: ep.title,
        subtitle: ep.guest,
        href: "/podcasts/$slug",
        hrefParams: { slug: ep.slug },
      };
    }),
    events: (eventsRes.data ?? []).map((row) => {
      const ev = row.events as { id: string; title: string; starts_at: string };
      return {
        id: ev.id,
        title: ev.title,
        subtitle: ev.starts_at,
        href: "/events/$id",
        hrefParams: { id: ev.id },
      };
    }),
    partners: (partnersRes.data ?? []).map((row) => {
      const partner = row.partners as { id: string; name: string; slug: string };
      return {
        id: partner.id,
        title: partner.name,
        href: "/partners/$slug",
        hrefParams: { slug: partner.slug },
      };
    }),
    grants: (grantsRes.data ?? []).map((row) => {
      const grant = row.grants as { id: string; title: string; funder: string | null; url: string | null };
      return {
        id: grant.id,
        title: grant.title,
        subtitle: grant.funder,
        href: grant.url ?? "/grants",
      };
    }),
  };
}

export async function fetchProgramCategories(): Promise<ProgramCategory[]> {
  const { data, error } = await supabase
    .from("program_categories")
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

export async function saveProgramCategory(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name is required");

  const { data, error } = await supabase.rpc("create_program_category", { p_name: trimmed });
  if (error) {
    if (error.message.includes("duplicate key")) {
      throw new Error("A category with this name already exists");
    }
    throw error;
  }

  const row = data as { id: string; name: string; slug: string; sort_order: number };
  return { id: row.id, name: row.name, slug: row.slug, sortOrder: row.sort_order } satisfies ProgramCategory;
}

export async function fetchAdminPrograms() {
  const { data, error } = await supabase
    .from("programs")
    .select(programListSelect)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mapListRow(row as Record<string, unknown>));
}

export async function fetchAdminProgramForm(programId: string): Promise<ProgramFormData> {
  const { data: program, error } = await supabase.from("programs").select("*").eq("id", programId).single();
  if (error) throw error;

  const [galleryRes, pubsRes, podsRes, eventsRes, partnersRes, grantsRes] = await Promise.all([
    supabase.from("program_images").select("*").eq("program_id", programId).order("sort_order"),
    supabase.from("program_publications").select("publication_id").eq("program_id", programId),
    supabase.from("program_podcast_episodes").select("podcast_episode_id").eq("program_id", programId),
    supabase.from("program_events").select("event_id").eq("program_id", programId),
    supabase.from("program_partners").select("partner_id").eq("program_id", programId),
    supabase.from("program_grants").select("grant_id").eq("program_id", programId),
  ]);

  return {
    slug: program.slug,
    name: program.name,
    short: program.short ?? "",
    tagline: program.tagline ?? "",
    descriptionHtml: program.description_html ?? "",
    objectivesHtml: program.objectives_html ?? "",
    coverImageUrl: program.cover_image_url ?? "",
    logoUrl: program.logo_url ?? "",
    categoryId: program.category_id ?? "",
    isFeatured: program.is_featured,
    isActive: program.is_active,
    sortOrder: program.sort_order,
    programDirector: program.program_director ?? "",
    contactPerson: program.contact_person ?? "",
    contactEmail: program.contact_email ?? "",
    contactPhone: program.contact_phone ?? "",
    websiteUrl: program.website_url ?? "",
    registrationUrl: program.registration_url ?? "",
    gallery: (galleryRes.data ?? []).map((g, i) => ({
      id: g.id,
      imageUrl: g.image_url,
      caption: g.caption,
      sortOrder: g.sort_order ?? i,
    })),
    publicationIds: (pubsRes.data ?? []).map((r) => r.publication_id),
    podcastIds: (podsRes.data ?? []).map((r) => r.podcast_episode_id),
    eventIds: (eventsRes.data ?? []).map((r) => r.event_id),
    partnerIds: (partnersRes.data ?? []).map((r) => r.partner_id),
    grantIds: (grantsRes.data ?? []).map((r) => r.grant_id),
  };
}

async function replaceProgramRelations(programId: string, form: ProgramFormData) {
  await Promise.all([
    supabase.from("program_images").delete().eq("program_id", programId),
    supabase.from("program_publications").delete().eq("program_id", programId),
    supabase.from("program_podcast_episodes").delete().eq("program_id", programId),
    supabase.from("program_events").delete().eq("program_id", programId),
    supabase.from("program_partners").delete().eq("program_id", programId),
    supabase.from("program_grants").delete().eq("program_id", programId),
  ]);

  if (form.gallery.length > 0) {
    const { error } = await supabase.from("program_images").insert(
      form.gallery.map((g, i) => ({
        program_id: programId,
        image_url: g.imageUrl,
        caption: g.caption,
        sort_order: g.sortOrder ?? i,
      })),
    );
    if (error) throw error;
  }

  const junctionInserts: Array<PromiseLike<{ error: unknown }>> = [];

  if (form.publicationIds.length > 0) {
    junctionInserts.push(
      supabase.from("program_publications").insert(
        form.publicationIds.map((id, i) => ({ program_id: programId, publication_id: id, sort_order: i })),
      ),
    );
  }
  if (form.podcastIds.length > 0) {
    junctionInserts.push(
      supabase.from("program_podcast_episodes").insert(
        form.podcastIds.map((id, i) => ({ program_id: programId, podcast_episode_id: id, sort_order: i })),
      ),
    );
  }
  if (form.eventIds.length > 0) {
    junctionInserts.push(
      supabase.from("program_events").insert(
        form.eventIds.map((id, i) => ({ program_id: programId, event_id: id, sort_order: i })),
      ),
    );
  }
  if (form.partnerIds.length > 0) {
    junctionInserts.push(
      supabase.from("program_partners").insert(
        form.partnerIds.map((id, i) => ({ program_id: programId, partner_id: id, sort_order: i })),
      ),
    );
  }
  if (form.grantIds.length > 0) {
    junctionInserts.push(
      supabase.from("program_grants").insert(
        form.grantIds.map((id, i) => ({ program_id: programId, grant_id: id, sort_order: i })),
      ),
    );
  }

  for (const insert of junctionInserts) {
    const { error } = await insert;
    if (error) throw error;
  }
}

export async function saveProgram(programId: string | null, form: ProgramFormData) {
  const payload = {
    slug: form.slug || slugify(form.name),
    name: form.name,
    short: form.short || null,
    tagline: form.tagline || null,
    description_html: form.descriptionHtml || null,
    objectives_html: form.objectivesHtml || null,
    cover_image_url: form.coverImageUrl || null,
    logo_url: form.logoUrl || null,
    category_id: form.categoryId || null,
    is_featured: form.isFeatured,
    is_active: form.isActive,
    sort_order: Number(form.sortOrder) || 0,
    program_director: form.programDirector || null,
    contact_person: form.contactPerson || null,
    contact_email: form.contactEmail || null,
    contact_phone: form.contactPhone || null,
    website_url: form.websiteUrl || null,
    registration_url: form.registrationUrl || null,
  };

  if (programId) {
    const { error } = await supabase.from("programs").update(payload).eq("id", programId);
    if (error) throw error;
    await replaceProgramRelations(programId, form);
    return programId;
  }

  const { data, error } = await supabase.from("programs").insert(payload).select("id").single();
  if (error) throw error;
  await replaceProgramRelations(data.id, form);
  return data.id;
}

export async function deleteProgram(programId: string) {
  const { error } = await supabase.from("programs").delete().eq("id", programId);
  if (error) throw error;
}

export const emptyProgramForm = (): ProgramFormData => ({
  slug: "",
  name: "",
  short: "",
  tagline: "",
  descriptionHtml: "",
  objectivesHtml: "",
  coverImageUrl: "",
  logoUrl: "",
  categoryId: "",
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
  programDirector: "",
  contactPerson: "",
  contactEmail: "",
  contactPhone: "",
  websiteUrl: "",
  registrationUrl: "",
  gallery: [],
  publicationIds: [],
  podcastIds: [],
  eventIds: [],
  partnerIds: [],
  grantIds: [],
});
