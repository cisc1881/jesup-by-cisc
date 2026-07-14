import { supabase } from "@/integrations/supabase/client";

export const EVENT_IMAGES_BUCKET = "event-images";

export type EventStatus = "draft" | "published" | "archived";
export type EventRegistrationStatus =
  "open" | "closed" | "waiting_list" | "sold_out" | "invite_only";
export type EventRegistrationRecordStatus = "registered" | "waiting_list" | "cancelled";

export type EventCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export type EventListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  descriptionHtml: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  locationAddress: string | null;
  lat: number | null;
  lng: number | null;
  capacity: number | null;
  registrationCount: number;
  spotsRemaining: number | null;
  coverImageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  registrationStatus: EventRegistrationStatus;
  registrationOpen: boolean;
  isFeatured: boolean;
  isActive: boolean;
  status: EventStatus;
  externalUrl: string | null;
};

export type EventSession = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  sortOrder: number;
};

export type EventSpeaker = {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  sortOrder: number;
};

export type EventGalleryImage = {
  id: string;
  imageUrl: string;
  caption: string | null;
  altText: string | null;
  sortOrder: number;
  isCover: boolean;
};

export type EventAttachment = {
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
  hrefParams?: Record<string, string>;
  imageUrl?: string | null;
};

export type EventSurvey = {
  id: string;
  title: string;
  qualtricsUrl: string | null;
  isActive: boolean;
};

export type EventDetail = EventListItem & {
  timezone: string | null;
  inviteCode: string | null;
  metadata: Record<string, unknown>;
  sessions: EventSession[];
  speakers: EventSpeaker[];
  gallery: EventGalleryImage[];
  sponsors: EventAttachment[];
  programs: EventAttachment[];
  publications: EventAttachment[];
  podcasts: EventAttachment[];
  partners: EventAttachment[];
  grants: EventAttachment[];
  survey: EventSurvey | null;
};

export type EventFormSession = Omit<EventSession, "id"> & { id?: string };
export type EventFormSpeaker = Omit<EventSpeaker, "id"> & { id?: string };
export type EventFormGalleryImage = Omit<EventGalleryImage, "id"> & { id?: string };

export type EventFormData = {
  slug: string;
  title: string;
  description: string;
  descriptionHtml: string;
  startsAt: string;
  endsAt: string;
  location: string;
  locationAddress: string;
  lat: string;
  lng: string;
  timezone: string;
  capacity: string;
  coverImageUrl: string;
  categoryId: string;
  status: EventStatus;
  isActive: boolean;
  isFeatured: boolean;
  registrationStatus: EventRegistrationStatus;
  registrationOpen: boolean;
  externalUrl: string;
  inviteCode: string;
  programIds: string[];
  publicationIds: string[];
  podcastIds: string[];
  partnerIds: string[];
  grantIds: string[];
  sessions: EventFormSession[];
  speakers: EventFormSpeaker[];
  gallery: EventFormGalleryImage[];
  surveyTitle: string;
  surveyUrl: string;
  surveyActive: boolean;
};

export type EventAdminRow = EventListItem & {
  status: EventStatus;
  createdAt: string;
};

export type EventRegistrationRow = {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  notes: string | null;
  status: EventRegistrationRecordStatus;
  ticketCode: string | null;
  checkedInAt: string | null;
  createdAt: string;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function registrationStatusLabel(status: EventRegistrationStatus) {
  const labels: Record<EventRegistrationStatus, string> = {
    open: "Open",
    closed: "Closed",
    waiting_list: "Waiting List",
    sold_out: "Sold Out",
    invite_only: "Invite Only",
  };
  return labels[status];
}

export function eventStatusLabel(status: EventStatus) {
  const labels: Record<EventStatus, string> = {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
  };
  return labels[status];
}

export async function uploadEventImage(file: File, prefix = "covers") {
  const path = `${prefix}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage
    .from(EVENT_IMAGES_BUCKET)
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const listSelect = `
  id, slug, title, description, description_html, starts_at, ends_at, location, location_address,
  lat, lng, capacity, image_url, category_id, registration_status, registration_open,
  is_featured, is_active, status, external_url,
  event_categories ( id, name, slug )
`;

async function fetchRegistrationCounts(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, number>();
  const entries = await Promise.all(
    eventIds.map(async (id) => {
      const { data, error } = await supabase.rpc("get_event_registration_count", {
        p_event_id: id,
      });
      if (error) throw error;
      return [id, Number(data ?? 0)] as const;
    }),
  );
  return new Map(entries);
}

function mapListRow(row: Record<string, unknown>, registrationCount = 0): EventListItem {
  const category = row.event_categories as
    { id: string; name: string; slug: string } | null | undefined;
  const capacity = (row.capacity as number | null) ?? null;
  const registrationStatus = (row.registration_status as EventRegistrationStatus) ?? "open";
  return {
    id: row.id as string,
    slug: (row.slug as string) ?? (row.id as string),
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    descriptionHtml: (row.description_html as string | null) ?? null,
    startsAt: row.starts_at as string,
    endsAt: (row.ends_at as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    locationAddress: (row.location_address as string | null) ?? null,
    lat: (row.lat as number | null) ?? null,
    lng: (row.lng as number | null) ?? null,
    capacity,
    registrationCount,
    spotsRemaining: capacity != null ? Math.max(capacity - registrationCount, 0) : null,
    coverImageUrl: (row.image_url as string | null) ?? null,
    categoryId: (row.category_id as string | null) ?? category?.id ?? null,
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    registrationStatus,
    registrationOpen: row.registration_open as boolean,
    isFeatured: row.is_featured as boolean,
    isActive: row.is_active as boolean,
    status: row.status as EventStatus,
    externalUrl: (row.external_url as string | null) ?? null,
  };
}

export async function fetchEventCategories(): Promise<EventCategory[]> {
  const { data, error } = await supabase
    .from("event_categories")
    .select("id, name, slug, sort_order")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sort_order,
  }));
}

export async function saveEventCategory(name: string): Promise<EventCategory> {
  const slug = slugify(name);
  const { data, error } = await supabase
    .from("event_categories")
    .insert({ name, slug })
    .select("id, name, slug, sort_order")
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name, slug: data.slug, sortOrder: data.sort_order };
}

export async function fetchEvents(options?: {
  activeOnly?: boolean;
  upcomingOnly?: boolean;
  featuredOnly?: boolean;
  limit?: number;
}): Promise<EventListItem[]> {
  let query = supabase.from("events").select(listSelect).order("starts_at", { ascending: true });

  if (options?.activeOnly !== false) {
    query = query.eq("status", "published").eq("is_active", true);
  }
  if (options?.upcomingOnly) query = query.gte("starts_at", new Date().toISOString());
  if (options?.featuredOnly) query = query.eq("is_featured", true);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  const countMap = await fetchRegistrationCounts(rows.map((r) => r.id));
  return rows.map((row) => mapListRow(row as Record<string, unknown>, countMap.get(row.id) ?? 0));
}

export async function fetchEventById(idOrSlug: string): Promise<EventDetail | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  let query = supabase
    .from("events")
    .select(`${listSelect}, timezone, metadata`)
    .eq("is_active", true)
    .eq("status", "published");
  query = isUuid ? query.eq("id", idOrSlug) : query.eq("slug", idOrSlug);

  const { data: row, error } = await query.maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const eventId = row.id as string;
  const countMap = await fetchRegistrationCounts([eventId]);

  const [
    sessionsRes,
    speakersRes,
    galleryRes,
    partnersRes,
    programsRes,
    publicationsRes,
    podcastsRes,
    grantsRes,
    surveyRes,
  ] = await Promise.all([
    supabase.from("event_sessions").select("*").eq("event_id", eventId).order("sort_order"),
    supabase.from("event_speakers").select("*").eq("event_id", eventId).order("sort_order"),
    supabase
      .from("event_gallery")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_public_approved", true)
      .order("sort_order"),
    supabase
      .from("event_partners")
      .select("sort_order, sponsorship_level, partners ( id, name, slug, logo_url, website_url )")
      .eq("event_id", eventId)
      .order("sort_order"),
    supabase
      .from("program_events")
      .select("sort_order, programs ( id, name, slug )")
      .eq("event_id", eventId)
      .order("sort_order"),
    supabase
      .from("publication_events")
      .select("sort_order, publications ( id, title, slug )")
      .eq("event_id", eventId)
      .order("sort_order"),
    supabase
      .from("event_podcast_episodes")
      .select("sort_order, podcast_episodes ( id, title, slug, guest )")
      .eq("event_id", eventId)
      .order("sort_order"),
    supabase
      .from("event_grants")
      .select("sort_order, grants ( id, title, funder )")
      .eq("event_id", eventId)
      .order("sort_order"),
    supabase.from("event_surveys").select("*").eq("event_id", eventId).maybeSingle(),
  ]);

  for (const res of [
    sessionsRes,
    speakersRes,
    galleryRes,
    partnersRes,
    programsRes,
    publicationsRes,
    podcastsRes,
    grantsRes,
    surveyRes,
  ]) {
    if (res.error) throw res.error;
  }

  const approvedGallery = [...(galleryRes.data ?? [])].sort((a, b) => {
    if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
    return a.sort_order - b.sort_order;
  });

  const base = mapListRow(row as Record<string, unknown>, countMap.get(eventId) ?? 0);

  return {
    ...base,
    timezone: (row.timezone as string | null) ?? null,
    inviteCode: null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    sessions: (sessionsRes.data ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      startsAt: s.starts_at,
      endsAt: s.ends_at,
      location: s.location,
      sortOrder: s.sort_order,
    })),
    speakers: (speakersRes.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      title: s.title,
      bio: s.bio,
      photoUrl: s.photo_url,
      sortOrder: s.sort_order,
    })),
    gallery: approvedGallery.map((g) => ({
      id: g.id,
      imageUrl: g.image_url,
      caption: g.caption,
      altText: g.alt_text,
      sortOrder: g.sort_order,
      isCover: g.is_cover,
    })),
    sponsors: (partnersRes.data ?? []).map((item) => {
      const partner = item.partners as {
        id: string;
        name: string;
        slug: string;
        logo_url: string | null;
        website_url: string | null;
      };
      return {
        id: partner.id,
        title: partner.name,
        subtitle: item.sponsorship_level,
        href: `/partners/$slug`,
        hrefParams: { slug: partner.slug },
        imageUrl: partner.logo_url,
      };
    }),
    programs: (programsRes.data ?? []).map((item) => {
      const program = item.programs as { id: string; name: string; slug: string };
      return {
        id: program.id,
        title: program.name,
        href: "/programs/$slug",
        hrefParams: { slug: program.slug },
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
      const ep = item.podcast_episodes as {
        id: string;
        title: string;
        slug: string;
        guest: string | null;
      };
      return {
        id: ep.id,
        title: ep.title,
        subtitle: ep.guest,
        href: "/podcasts/$slug",
        hrefParams: { slug: ep.slug },
      };
    }),
    partners: (partnersRes.data ?? []).map((item) => {
      const partner = item.partners as {
        id: string;
        name: string;
        slug: string;
        logo_url: string | null;
      };
      return {
        id: partner.id,
        title: partner.name,
        href: `/partners/$slug`,
        hrefParams: { slug: partner.slug },
        imageUrl: partner.logo_url,
      };
    }),
    grants: (grantsRes.data ?? []).map((item) => {
      const grant = item.grants as { id: string; title: string; funder: string | null };
      return { id: grant.id, title: grant.title, subtitle: grant.funder, href: "/grants" };
    }),
    survey: surveyRes.data
      ? {
          id: surveyRes.data.id,
          title: surveyRes.data.title,
          qualtricsUrl: surveyRes.data.qualtrics_url,
          isActive: surveyRes.data.is_active,
        }
      : null,
  };
}

export function filterEvents(
  events: EventListItem[],
  search: string,
  categoryId: string | null,
  savedOnly: boolean,
  savedIds: Set<string>,
) {
  const q = search.trim().toLowerCase();
  return events.filter((event) => {
    const matchesCategory = !categoryId || event.categoryId === categoryId;
    const matchesSaved = !savedOnly || savedIds.has(event.id);
    const matchesSearch =
      !q ||
      [event.title, event.description, event.location, event.categoryName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q));
    return matchesCategory && matchesSearch && matchesSaved;
  });
}

export function partitionEvents(events: EventListItem[], now = Date.now()) {
  const featured =
    events.find((e) => e.isFeatured && new Date(e.startsAt).getTime() >= now) ??
    events.find((e) => new Date(e.startsAt).getTime() >= now) ??
    null;
  const upcoming = events.filter(
    (e) => new Date(e.startsAt).getTime() >= now && e.id !== featured?.id,
  );
  const weekEnd = now + 7 * 24 * 60 * 60 * 1000;
  const monthEnd = now + 30 * 24 * 60 * 60 * 1000;
  const thisWeek = upcoming.filter((e) => new Date(e.startsAt).getTime() <= weekEnd);
  const thisMonth = upcoming.filter((e) => {
    const t = new Date(e.startsAt).getTime();
    return t > weekEnd && t <= monthEnd;
  });
  const later = upcoming.filter((e) => new Date(e.startsAt).getTime() > monthEnd);
  const past = events.filter((e) => new Date(e.startsAt).getTime() < now);
  return { featured, upcoming, thisWeek, thisMonth, later, past };
}

export async function fetchAdminEvents(): Promise<EventAdminRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select(`${listSelect}, created_at`)
    .order("starts_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const countMap = await fetchRegistrationCounts(rows.map((r) => r.id));
  return rows.map((row) => ({
    ...mapListRow(row as Record<string, unknown>, countMap.get(row.id) ?? 0),
    createdAt: row.created_at as string,
  }));
}

export function emptyEventForm(): EventFormData {
  return {
    slug: "",
    title: "",
    description: "",
    descriptionHtml: "",
    startsAt: "",
    endsAt: "",
    location: "",
    locationAddress: "",
    lat: "",
    lng: "",
    timezone: "America/Chicago",
    capacity: "",
    coverImageUrl: "",
    categoryId: "",
    status: "draft",
    isActive: true,
    isFeatured: false,
    registrationStatus: "open",
    registrationOpen: true,
    externalUrl: "",
    inviteCode: "",
    programIds: [],
    publicationIds: [],
    podcastIds: [],
    partnerIds: [],
    grantIds: [],
    sessions: [],
    speakers: [],
    gallery: [],
    surveyTitle: "Post-event survey",
    surveyUrl: "",
    surveyActive: false,
  };
}

export async function fetchAdminEventForm(eventId: string): Promise<EventFormData> {
  const { data: row, error } = await supabase.from("events").select("*").eq("id", eventId).single();
  if (error) throw error;

  const [
    programsRes,
    pubsRes,
    podcastsRes,
    partnersRes,
    grantsRes,
    sessionsRes,
    speakersRes,
    galleryRes,
    surveyRes,
    evaluationRes,
  ] = await Promise.all([
    supabase.from("program_events").select("program_id").eq("event_id", eventId),
    supabase.from("publication_events").select("publication_id").eq("event_id", eventId),
    supabase.from("event_podcast_episodes").select("podcast_episode_id").eq("event_id", eventId),
    supabase.from("event_partners").select("partner_id").eq("event_id", eventId),
    supabase.from("event_grants").select("grant_id").eq("event_id", eventId),
    supabase.from("event_sessions").select("*").eq("event_id", eventId).order("sort_order"),
    supabase.from("event_speakers").select("*").eq("event_id", eventId).order("sort_order"),
    supabase.from("event_gallery").select("*").eq("event_id", eventId).order("sort_order"),
    supabase.from("event_surveys").select("*").eq("event_id", eventId).maybeSingle(),
    supabase
      .from("event_evaluations")
      .select("title, qualtrics_url, is_active")
      .eq("event_id", eventId)
      .maybeSingle(),
  ]);

  for (const res of [
    programsRes,
    pubsRes,
    podcastsRes,
    partnersRes,
    grantsRes,
    sessionsRes,
    speakersRes,
    galleryRes,
    surveyRes,
    evaluationRes,
  ]) {
    if (res.error) throw res.error;
  }

  return {
    slug: row.slug ?? "",
    title: row.title,
    description: row.description ?? "",
    descriptionHtml: row.description_html ?? "",
    startsAt: row.starts_at ? new Date(row.starts_at).toISOString().slice(0, 16) : "",
    endsAt: row.ends_at ? new Date(row.ends_at).toISOString().slice(0, 16) : "",
    location: row.location ?? "",
    locationAddress: row.location_address ?? "",
    lat: row.lat != null ? String(row.lat) : "",
    lng: row.lng != null ? String(row.lng) : "",
    timezone: row.timezone ?? "America/Chicago",
    capacity: row.capacity != null ? String(row.capacity) : "",
    coverImageUrl: row.image_url ?? "",
    categoryId: row.category_id ?? "",
    status: row.status as EventStatus,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    registrationStatus: row.registration_status as EventRegistrationStatus,
    registrationOpen: row.registration_open,
    externalUrl: row.external_url ?? "",
    inviteCode: row.invite_code ?? "",
    programIds: (programsRes.data ?? []).map((r) => r.program_id),
    publicationIds: (pubsRes.data ?? []).map((r) => r.publication_id),
    podcastIds: (podcastsRes.data ?? []).map((r) => r.podcast_episode_id),
    partnerIds: (partnersRes.data ?? []).map((r) => r.partner_id),
    grantIds: (grantsRes.data ?? []).map((r) => r.grant_id),
    sessions: (sessionsRes.data ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description ?? "",
      startsAt: s.starts_at ? new Date(s.starts_at).toISOString().slice(0, 16) : "",
      endsAt: s.ends_at ? new Date(s.ends_at).toISOString().slice(0, 16) : "",
      location: s.location ?? "",
      sortOrder: s.sort_order,
    })),
    speakers: (speakersRes.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      title: s.title ?? "",
      bio: s.bio ?? "",
      photoUrl: s.photo_url ?? "",
      sortOrder: s.sort_order,
    })),
    gallery: (galleryRes.data ?? []).map((g) => ({
      id: g.id,
      imageUrl: g.image_url,
      caption: g.caption ?? "",
      sortOrder: g.sort_order,
    })),
    surveyTitle: evaluationRes.data?.title ?? surveyRes.data?.title ?? "Post-event survey",
    surveyUrl: evaluationRes.data?.qualtrics_url ?? surveyRes.data?.qualtrics_url ?? "",
    surveyActive: evaluationRes.data?.is_active ?? surveyRes.data?.is_active ?? false,
  };
}

async function replaceEventRelations(eventId: string, form: EventFormData) {
  await Promise.all([
    supabase.from("program_events").delete().eq("event_id", eventId),
    supabase.from("publication_events").delete().eq("event_id", eventId),
    supabase.from("event_podcast_episodes").delete().eq("event_id", eventId),
    supabase.from("event_partners").delete().eq("event_id", eventId),
    supabase.from("event_grants").delete().eq("event_id", eventId),
    supabase.from("event_sessions").delete().eq("event_id", eventId),
    supabase.from("event_speakers").delete().eq("event_id", eventId),
  ]);

  const inserts: Promise<unknown>[] = [];

  if (form.programIds.length) {
    inserts.push(
      supabase.from("program_events").insert(
        form.programIds.map((programId, index) => ({
          event_id: eventId,
          program_id: programId,
          sort_order: index,
        })),
      ),
    );
  }
  if (form.publicationIds.length) {
    inserts.push(
      supabase.from("publication_events").insert(
        form.publicationIds.map((publicationId, index) => ({
          event_id: eventId,
          publication_id: publicationId,
          sort_order: index,
        })),
      ),
    );
  }
  if (form.podcastIds.length) {
    inserts.push(
      supabase.from("event_podcast_episodes").insert(
        form.podcastIds.map((podcastId, index) => ({
          event_id: eventId,
          podcast_episode_id: podcastId,
          sort_order: index,
        })),
      ),
    );
  }
  if (form.partnerIds.length) {
    inserts.push(
      supabase.from("event_partners").insert(
        form.partnerIds.map((partnerId, index) => ({
          event_id: eventId,
          partner_id: partnerId,
          sort_order: index,
        })),
      ),
    );
  }
  if (form.grantIds.length) {
    inserts.push(
      supabase.from("event_grants").insert(
        form.grantIds.map((grantId, index) => ({
          event_id: eventId,
          grant_id: grantId,
          sort_order: index,
        })),
      ),
    );
  }
  if (form.sessions.length) {
    inserts.push(
      supabase.from("event_sessions").insert(
        form.sessions.map((session, index) => ({
          event_id: eventId,
          title: session.title,
          description: session.description || null,
          starts_at: session.startsAt || null,
          ends_at: session.endsAt || null,
          location: session.location || null,
          sort_order: index,
        })),
      ),
    );
  }
  if (form.speakers.length) {
    inserts.push(
      supabase.from("event_speakers").insert(
        form.speakers.map((speaker, index) => ({
          event_id: eventId,
          name: speaker.name,
          title: speaker.title || null,
          bio: speaker.bio || null,
          photo_url: speaker.photoUrl || null,
          sort_order: index,
        })),
      ),
    );
  }

  const results = await Promise.all(inserts);
  for (const res of results) {
    if (res && typeof res === "object" && "error" in res && res.error) throw res.error;
  }

  if (form.surveyUrl.trim() || form.surveyActive) {
    const { error } = await supabase.from("event_surveys").upsert(
      {
        event_id: eventId,
        title: form.surveyTitle || "Post-event survey",
        qualtrics_url: form.surveyUrl || null,
        is_active: form.surveyActive,
      },
      { onConflict: "event_id" },
    );
    if (error) throw error;
  } else {
    await supabase.from("event_surveys").delete().eq("event_id", eventId);
  }
}

export async function saveEvent(eventId: string | null, form: EventFormData) {
  const slug = form.slug.trim() || slugify(form.title);
  const registrationOpen =
    form.registrationStatus === "open" || form.registrationStatus === "waiting_list";
  const payload = {
    slug,
    title: form.title,
    description: form.description || null,
    description_html: form.descriptionHtml || null,
    starts_at: form.startsAt,
    ends_at: form.endsAt || null,
    location: form.location || null,
    location_address: form.locationAddress || null,
    lat: form.lat ? Number(form.lat) : null,
    lng: form.lng ? Number(form.lng) : null,
    timezone: form.timezone || "America/Chicago",
    capacity: form.capacity === "" ? null : Number(form.capacity),
    image_url: form.coverImageUrl || null,
    category_id: form.categoryId || null,
    status: form.status,
    is_active: form.isActive,
    is_featured: form.isFeatured,
    registration_status: form.registrationStatus,
    registration_open: registrationOpen,
    external_url: form.externalUrl || null,
    invite_code: form.inviteCode || null,
  };

  if (eventId) {
    const { error } = await supabase.from("events").update(payload).eq("id", eventId);
    if (error) throw error;
    await replaceEventRelations(eventId, form);
    return eventId;
  }

  const { data, error } = await supabase.from("events").insert(payload).select("id").single();
  if (error) throw error;
  await replaceEventRelations(data.id, form);
  return data.id;
}

export async function duplicateEvent(eventId: string) {
  const form = await fetchAdminEventForm(eventId);
  form.title = `${form.title} (Copy)`;
  form.slug = `${form.slug}-copy`;
  form.status = "draft";
  form.isFeatured = false;
  return saveEvent(null, form);
}

export async function deleteEvent(eventId: string) {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
}

export async function fetchEventRegistrations(eventId: string): Promise<EventRegistrationRow[]> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select(
      "id, user_id, notes, status, ticket_code, checked_in_at, created_at, profiles ( full_name, email )",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const profile = row.profiles as { full_name: string | null; email: string | null } | null;
    return {
      id: row.id,
      userId: row.user_id,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
      notes: row.notes,
      status: row.status as EventRegistrationRecordStatus,
      ticketCode: row.ticket_code,
      checkedInAt: row.checked_in_at,
      createdAt: row.created_at,
    };
  });
}

export async function checkInRegistration(registrationId: string, eventId: string) {
  const { markRegistrationAttendance } = await import("@/lib/attendance");
  const { data: auth } = await supabase.auth.getUser();
  await markRegistrationAttendance({
    eventId,
    registrationId,
    status: "checked_in",
    adminUserId: auth.user?.id ?? null,
    attendanceMethod: "manual",
    syncLegacyCheckin: true,
  });
}

export async function fetchUserEventRegistration(eventId: string, userId: string) {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("id, status, ticket_code, checked_in_at, notes, created_at")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function registerForEvent(
  eventId: string,
  userId: string,
  notes?: string,
  inviteCode?: string,
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || auth.user.id !== userId) throw new Error("Sign in is required to register");

  const { data, error } = await supabase.rpc("register_for_event", {
    p_event_id: eventId,
    p_notes: notes || undefined,
    p_invite_code: inviteCode || undefined,
  });
  if (error) throw error;
  if (!data?.[0]) throw new Error("Registration was not created");
  return data[0];
}

export async function getEventAnalytics(eventId: string) {
  const [regs, checkins] = await Promise.all([
    supabase
      .from("event_registrations")
      .select("status", { count: "exact" })
      .eq("event_id", eventId),
    supabase
      .from("event_checkins")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId),
  ]);
  if (regs.error) throw regs.error;
  if (checkins.error) throw checkins.error;

  const rows = regs.data ?? [];
  return {
    registered: rows.filter((r) => r.status === "registered").length,
    waitingList: rows.filter((r) => r.status === "waiting_list").length,
    cancelled: rows.filter((r) => r.status === "cancelled").length,
    checkedIn: checkins.count ?? 0,
  };
}
