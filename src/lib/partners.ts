import { supabase } from "@/integrations/supabase/client";
import type { PartnerCategory } from "@/lib/partner-categories";
import { PARTNER_IMPACT_GROUPS } from "@/lib/partner-categories";
import type { PartnershipFocusArea } from "@/lib/partner-focus-areas";

export const PARTNER_LOGOS_BUCKET = "partner-logos";

export type PartnerSocialLinks = {
  twitter?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  youtube?: string | null;
};

export type PartnerListItem = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  category: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  email: string | null;
  phone: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  partnershipAreas: string[];
  sortOrder: number;
  createdAt: string;
};

export type PartnerAttachment = {
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
  hrefParams?: Record<string, string>;
};

export type PartnerDetail = PartnerListItem & {
  mission: string | null;
  address: string | null;
  socialLinks: PartnerSocialLinks;
  programs: PartnerAttachment[];
  events: PartnerAttachment[];
  publications: PartnerAttachment[];
  podcasts: PartnerAttachment[];
};

export type PartnerImpactCounts = Record<(typeof PARTNER_IMPACT_GROUPS)[number]["id"], number>;

export type PartnerFormData = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  mission: string;
  category: string;
  logoUrl: string;
  websiteUrl: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  socialLinks: PartnerSocialLinks;
  partnershipAreas: string[];
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  programIds: string[];
  eventIds: string[];
  publicationIds: string[];
  podcastIds: string[];
};

export type PartnerSortMode = "alphabetical" | "featured" | "newest";

const listSelect = `
  id, slug, name, short_description, description, category, logo_url, website_url,
  email, phone, is_featured, is_published, partnership_areas, sort_order, created_at
`;

function mapListRow(row: Record<string, unknown>): PartnerListItem {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    shortDescription: (row.short_description as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    logoUrl: (row.logo_url as string | null) ?? null,
    websiteUrl: (row.website_url as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    isFeatured: (row.is_featured as boolean) ?? false,
    isPublished: row.is_published as boolean,
    partnershipAreas: (row.partnership_areas as string[] | null) ?? [],
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadPartnerLogo(file: File) {
  const path = `logos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from(PARTNER_LOGOS_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(PARTNER_LOGOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchPartners(options?: {
  publishedOnly?: boolean;
  featuredOnly?: boolean;
  limit?: number;
}) {
  let query = supabase.from("partners").select(listSelect).order("sort_order", { ascending: true }).order("name");

  if (options?.publishedOnly !== false) query = query.eq("is_published", true);
  if (options?.featuredOnly) query = query.eq("is_featured", true);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapListRow(row as Record<string, unknown>));
}

export function computePartnerImpactCounts(partners: PartnerListItem[]): PartnerImpactCounts {
  const published = partners.filter((p) => p.isPublished);
  const counts = {
    strategicPartners: published.length,
    federalAgencies: 0,
    universitiesResearch: 0,
    communityOrganizations: 0,
    corporatePartners: 0,
    foundations: 0,
  };

  for (const partner of published) {
    const cat = partner.category as PartnerCategory | null;
    if (!cat) continue;
    if (cat === "Federal Government") counts.federalAgencies += 1;
    if (cat === "University & Extension" || cat === "Research") counts.universitiesResearch += 1;
    if (cat === "Community Organization") counts.communityOrganizations += 1;
    if (cat === "Corporate") counts.corporatePartners += 1;
    if (cat === "Foundation") counts.foundations += 1;
  }

  return counts;
}

export async function fetchPartnerImpactCounts(): Promise<PartnerImpactCounts> {
  const partners = await fetchPartners();
  return computePartnerImpactCounts(partners);
}

export function filterPartners(
  partners: PartnerListItem[],
  search: string,
  category: string | null,
  focusArea: string | null,
) {
  const q = search.trim().toLowerCase();
  return partners.filter((p) => {
    if (category && category !== "All" && p.category !== category) return false;
    if (focusArea && !p.partnershipAreas.includes(focusArea)) return false;
    if (!q) return true;
    return [p.name, p.shortDescription, p.description, p.category, ...p.partnershipAreas]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(q));
  });
}

export function sortPartners(partners: PartnerListItem[], mode: PartnerSortMode) {
  const sorted = [...partners];
  if (mode === "alphabetical") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (mode === "featured") {
    sorted.sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  } else {
    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return sorted;
}

export async function fetchPartnerBySlug(slug: string): Promise<PartnerDetail | null> {
  const { data: row, error } = await supabase
    .from("partners")
    .select(
      `${listSelect}, mission, address, social_links`,
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const partnerId = row.id as string;
  const [programsRes, eventsRes, publicationsRes, podcastsRes] = await Promise.all([
    supabase
      .from("program_partners")
      .select("sort_order, programs ( id, name, slug )")
      .eq("partner_id", partnerId)
      .order("sort_order"),
    supabase
      .from("event_partners")
      .select("sort_order, events ( id, title, starts_at )")
      .eq("partner_id", partnerId)
      .order("sort_order"),
    supabase
      .from("partner_publications")
      .select("sort_order, publications ( id, title, slug )")
      .eq("partner_id", partnerId)
      .order("sort_order"),
    supabase
      .from("partner_podcast_episodes")
      .select("sort_order, podcast_episodes ( id, title, slug, guest )")
      .eq("partner_id", partnerId)
      .order("sort_order"),
  ]);

  for (const res of [programsRes, eventsRes, publicationsRes, podcastsRes]) {
    if (res.error) throw res.error;
  }

  const base = mapListRow(row as Record<string, unknown>);
  return {
    ...base,
    mission: (row.mission as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    socialLinks: (row.social_links as PartnerSocialLinks) ?? {},
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
    podcasts: (podcastsRes.data ?? []).map((item) => {
      const ep = item.podcast_episodes as { id: string; title: string; slug: string; guest: string | null };
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

export async function fetchAdminPartners() {
  const { data, error } = await supabase
    .from("partners")
    .select(listSelect)
    .order("sort_order", { ascending: true })
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => mapListRow(row as Record<string, unknown>));
}

export async function fetchAdminPartnerForm(partnerId: string): Promise<PartnerFormData> {
  const { data: row, error } = await supabase.from("partners").select("*").eq("id", partnerId).single();
  if (error) throw error;

  const [programsRes, eventsRes, publicationsRes, podcastsRes] = await Promise.all([
    supabase.from("program_partners").select("program_id").eq("partner_id", partnerId),
    supabase.from("event_partners").select("event_id").eq("partner_id", partnerId),
    supabase.from("partner_publications").select("publication_id").eq("partner_id", partnerId),
    supabase.from("partner_podcast_episodes").select("podcast_episode_id").eq("partner_id", partnerId),
  ]);

  return {
    slug: row.slug ?? "",
    name: row.name,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    mission: row.mission ?? "",
    category: row.category ?? "",
    logoUrl: row.logo_url ?? "",
    websiteUrl: row.website_url ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    notes: row.notes ?? "",
    socialLinks: (row.social_links as PartnerSocialLinks) ?? {},
    partnershipAreas: (row.partnership_areas as string[]) ?? [],
    isPublished: row.is_published ?? true,
    isFeatured: row.is_featured ?? false,
    sortOrder: row.sort_order ?? 0,
    programIds: (programsRes.data ?? []).map((r) => r.program_id),
    eventIds: (eventsRes.data ?? []).map((r) => r.event_id),
    publicationIds: (publicationsRes.data ?? []).map((r) => r.publication_id),
    podcastIds: (podcastsRes.data ?? []).map((r) => r.podcast_episode_id),
  };
}

export function emptyPartnerForm(): PartnerFormData {
  return {
    slug: "",
    name: "",
    shortDescription: "",
    description: "",
    mission: "",
    category: "",
    logoUrl: "",
    websiteUrl: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    socialLinks: {},
    partnershipAreas: [],
    isPublished: true,
    isFeatured: false,
    sortOrder: 0,
    programIds: [],
    eventIds: [],
    publicationIds: [],
    podcastIds: [],
  };
}

async function clearOtherFeatured(excludeId?: string) {
  let query = supabase.from("partners").update({ is_featured: false }).eq("is_featured", true);
  if (excludeId) query = query.neq("id", excludeId);
  const { error } = await query;
  if (error) throw error;
}

async function replacePartnerRelations(partnerId: string, form: PartnerFormData) {
  await Promise.all([
    supabase.from("program_partners").delete().eq("partner_id", partnerId),
    supabase.from("event_partners").delete().eq("partner_id", partnerId),
    supabase.from("partner_publications").delete().eq("partner_id", partnerId),
    supabase.from("partner_podcast_episodes").delete().eq("partner_id", partnerId),
  ]);

  if (form.programIds.length) {
    const { error } = await supabase.from("program_partners").insert(
      form.programIds.map((programId, i) => ({ partner_id: partnerId, program_id: programId, sort_order: i })),
    );
    if (error) throw error;
  }
  if (form.eventIds.length) {
    const { error } = await supabase.from("event_partners").insert(
      form.eventIds.map((eventId, i) => ({ partner_id: partnerId, event_id: eventId, sort_order: i })),
    );
    if (error) throw error;
  }
  if (form.publicationIds.length) {
    const { error } = await supabase.from("partner_publications").insert(
      form.publicationIds.map((publicationId, i) => ({
        partner_id: partnerId,
        publication_id: publicationId,
        sort_order: i,
      })),
    );
    if (error) throw error;
  }
  if (form.podcastIds.length) {
    const { error } = await supabase.from("partner_podcast_episodes").insert(
      form.podcastIds.map((podcastEpisodeId, i) => ({
        partner_id: partnerId,
        podcast_episode_id: podcastEpisodeId,
        sort_order: i,
      })),
    );
    if (error) throw error;
  }
}

export async function savePartner(partnerId: string | null, form: PartnerFormData) {
  const slug = form.slug.trim() || slugify(form.name);
  if (!form.name.trim()) throw new Error("Name is required");

  if (form.isFeatured) {
    await clearOtherFeatured(partnerId ?? undefined);
  }

  const payload = {
    slug,
    name: form.name.trim(),
    short_description: form.shortDescription.trim() || null,
    description: form.description.trim() || null,
    mission: form.mission.trim() || null,
    category: form.category || null,
    logo_url: form.logoUrl.trim() || null,
    website_url: form.websiteUrl.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    address: form.address.trim() || null,
    notes: form.notes.trim() || null,
    social_links: form.socialLinks,
    partnership_areas: form.partnershipAreas,
    is_published: form.isPublished,
    is_featured: form.isFeatured,
    sort_order: Number(form.sortOrder) || 0,
  };

  let id = partnerId;
  if (partnerId) {
    const { error } = await supabase.from("partners").update(payload).eq("id", partnerId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from("partners").insert(payload).select("id").single();
    if (error) throw error;
    id = data.id as string;
  }

  await replacePartnerRelations(id!, form);
  return id!;
}

export async function deletePartner(partnerId: string) {
  const { error } = await supabase.from("partners").delete().eq("id", partnerId);
  if (error) throw error;
}

export function partnerCardDescription(partner: PartnerListItem) {
  return partner.shortDescription ?? partner.description;
}
