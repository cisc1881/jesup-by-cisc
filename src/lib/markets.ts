import { supabase } from "@/integrations/supabase/client";
import { distanceKm } from "@/lib/market-geo";

export const MARKET_IMAGES_BUCKET = "market-images";

export type MarketProductCategory =
  | "fruit"
  | "vegetables"
  | "meat"
  | "eggs"
  | "dairy"
  | "honey"
  | "plants"
  | "flowers"
  | "value_added"
  | "prepared_foods"
  | "crafts";

export type MarketAnnouncementType = "general" | "closure" | "weather" | "seasonal";

export const MARKET_PRODUCT_CATEGORY_LABELS: Record<MarketProductCategory, string> = {
  fruit: "Fruit",
  vegetables: "Vegetables",
  meat: "Meat",
  eggs: "Eggs",
  dairy: "Dairy",
  honey: "Honey",
  plants: "Plants",
  flowers: "Flowers",
  value_added: "Value-added",
  prepared_foods: "Prepared foods",
  crafts: "Crafts",
};

export const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type MarketHour = {
  id?: string;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
  sortOrder: number;
};

export type MarketImage = {
  id?: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
};

export type MarketVendor = {
  id?: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  socialUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  seasonalAvailability: string | null;
  sortOrder: number;
  isActive: boolean;
  products: MarketProduct[];
};

export type MarketProduct = {
  id?: string;
  vendorId?: string;
  name: string;
  category: MarketProductCategory;
  description: string | null;
  availableToday: boolean;
  season: string | null;
  isOrganic: boolean;
  isLocal: boolean;
  sortOrder: number;
};

export type MarketAnnouncement = {
  id?: string;
  title: string;
  body: string | null;
  announcementType: MarketAnnouncementType;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
};

export type MarketAttachment = {
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
  hrefParams?: Record<string, string>;
};

export type MarketListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  hours: string | null;
  season: string | null;
  coverImageUrl: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  acceptsSnapEbt: boolean;
  acceptsCredit: boolean;
  parkingInfo: string | null;
  isFeatured: boolean;
  isActive: boolean;
  isOpenToday: boolean;
  isOpenThisWeekend: boolean;
  distanceKm: number | null;
};

export type MarketDetail = MarketListItem & {
  contactName: string | null;
  paymentNotes: string | null;
  metadata: Record<string, unknown>;
  structuredHours: MarketHour[];
  gallery: MarketImage[];
  vendors: MarketVendor[];
  announcements: MarketAnnouncement[];
  events: MarketAttachment[];
  programs: MarketAttachment[];
  nearbyMarkets: MarketListItem[];
};

export type MarketFormVendor = MarketVendor;
export type MarketFormProduct = MarketProduct & { vendorIndex: number };

export type MarketFormData = {
  slug: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  lat: string;
  lng: string;
  hours: string;
  season: string;
  coverImageUrl: string;
  phone: string;
  email: string;
  websiteUrl: string;
  contactName: string;
  acceptsSnapEbt: boolean;
  acceptsCredit: boolean;
  parkingInfo: string;
  paymentNotes: string;
  isFeatured: boolean;
  isActive: boolean;
  structuredHours: MarketHour[];
  gallery: MarketImage[];
  vendors: MarketFormVendor[];
  announcements: MarketAnnouncement[];
  eventIds: string[];
  programIds: string[];
};

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function formatMarketAddress(market: Pick<MarketListItem, "address" | "city" | "state">) {
  return [market.address, market.city, market.state].filter(Boolean).join(", ");
}

export async function uploadMarketImage(file: File, prefix = "covers") {
  const path = `${prefix}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from(MARKET_IMAGES_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(MARKET_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const listSelect = `
  id, slug, name, description, address, city, state, lat, lng, hours, season, image_url,
  phone, email, website_url, accepts_snap_ebt, accepts_credit, parking_info,
  is_featured, is_active
`;

function parseTimeToMinutes(value: string | null) {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function isMarketOpenToday(hours: MarketHour[], now = new Date()) {
  const day = now.getDay();
  const row = hours.find((h) => h.dayOfWeek === day);
  if (!row || row.isClosed) return false;
  const open = parseTimeToMinutes(row.opensAt);
  const close = parseTimeToMinutes(row.closesAt);
  if (open == null || close == null) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= open && current <= close;
}

export function isMarketOpenOnDay(hours: MarketHour[], dayOfWeek: number) {
  const row = hours.find((h) => h.dayOfWeek === dayOfWeek);
  return Boolean(row && !row.isClosed && row.opensAt && row.closesAt);
}

export function isMarketOpenThisWeekend(hours: MarketHour[]) {
  return isMarketOpenOnDay(hours, 6) || isMarketOpenOnDay(hours, 0);
}

function mapHourRow(row: Record<string, unknown>): MarketHour {
  return {
    id: row.id as string,
    dayOfWeek: row.day_of_week as number,
    opensAt: (row.opens_at as string | null) ?? null,
    closesAt: (row.closes_at as string | null) ?? null,
    isClosed: row.is_closed as boolean,
    sortOrder: row.sort_order as number,
  };
}

function mapListRow(
  row: Record<string, unknown>,
  structuredHours: MarketHour[] = [],
  coords?: { lat: number; lng: number } | null,
): MarketListItem {
  const lat = (row.lat as number | null) ?? null;
  const lng = (row.lng as number | null) ?? null;
  return {
    id: row.id as string,
    slug: (row.slug as string) ?? (row.id as string),
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    lat,
    lng,
    hours: (row.hours as string | null) ?? null,
    season: (row.season as string | null) ?? null,
    coverImageUrl: (row.image_url as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    websiteUrl: (row.website_url as string | null) ?? null,
    acceptsSnapEbt: row.accepts_snap_ebt as boolean,
    acceptsCredit: row.accepts_credit as boolean,
    parkingInfo: (row.parking_info as string | null) ?? null,
    isFeatured: row.is_featured as boolean,
    isActive: row.is_active as boolean,
    isOpenToday: isMarketOpenToday(structuredHours),
    isOpenThisWeekend: isMarketOpenThisWeekend(structuredHours),
    distanceKm: coords && lat != null && lng != null ? distanceKm(coords, { lat, lng }) : null,
  };
}

async function fetchHoursForMarkets(marketIds: string[]) {
  if (marketIds.length === 0) return new Map<string, MarketHour[]>();
  const { data, error } = await supabase
    .from("market_hours")
    .select("*")
    .in("market_id", marketIds)
    .order("day_of_week");
  if (error) throw error;
  const map = new Map<string, MarketHour[]>();
  for (const row of data ?? []) {
    const list = map.get(row.market_id) ?? [];
    list.push(mapHourRow(row as Record<string, unknown>));
    map.set(row.market_id, list);
  }
  return map;
}

export async function fetchMarkets(options?: {
  activeOnly?: boolean;
  featuredOnly?: boolean;
  coords?: { lat: number; lng: number } | null;
}): Promise<MarketListItem[]> {
  let query = supabase.from("markets").select(listSelect).order("name");
  if (options?.activeOnly !== false) query = query.eq("is_active", true);
  if (options?.featuredOnly) query = query.eq("is_featured", true);

  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  const hoursMap = await fetchHoursForMarkets(rows.map((r) => r.id));

  const mapped = rows.map((row) =>
    mapListRow(row as Record<string, unknown>, hoursMap.get(row.id) ?? [], options?.coords),
  );

  if (options?.coords) {
    mapped.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }

  return mapped;
}

export async function fetchMarketById(idOrSlug: string, coords?: { lat: number; lng: number } | null): Promise<MarketDetail | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  let query = supabase.from("markets").select(`${listSelect}, contact_name, payment_notes, metadata`).eq("is_active", true);
  query = isUuid ? query.eq("id", idOrSlug) : query.eq("slug", idOrSlug);

  const { data: row, error } = await query.maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const marketId = row.id as string;
  const [hoursRes, galleryRes, vendorsRes, announcementsRes, eventsRes, programsRes, allMarkets] =
    await Promise.all([
      supabase.from("market_hours").select("*").eq("market_id", marketId).order("day_of_week"),
      supabase.from("market_images").select("*").eq("market_id", marketId).order("sort_order"),
      supabase.from("market_vendors").select("*").eq("market_id", marketId).eq("is_active", true).order("sort_order"),
      supabase.from("market_announcements").select("*").eq("market_id", marketId).eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("market_events").select("sort_order, events ( id, title, starts_at )").eq("market_id", marketId).order("sort_order"),
      supabase.from("market_programs").select("sort_order, programs ( id, name, slug )").eq("market_id", marketId).order("sort_order"),
      fetchMarkets({ coords }),
    ]);

  for (const res of [hoursRes, galleryRes, vendorsRes, announcementsRes, eventsRes, programsRes]) {
    if (res.error) throw res.error;
  }

  const structuredHours = (hoursRes.data ?? []).map((h) => mapHourRow(h as Record<string, unknown>));
  const vendorIds = (vendorsRes.data ?? []).map((v) => v.id);
  let products: MarketProduct[] = [];
  if (vendorIds.length > 0) {
    const { data: productRows, error: productsError } = await supabase
      .from("market_products")
      .select("*")
      .in("vendor_id", vendorIds)
      .order("sort_order");
    if (productsError) throw productsError;
    products = (productRows ?? []).map((p) => ({
      id: p.id,
      vendorId: p.vendor_id,
      name: p.name,
      category: p.category as MarketProductCategory,
      description: p.description,
      availableToday: p.available_today,
      season: p.season,
      isOrganic: p.is_organic,
      isLocal: p.is_local,
      sortOrder: p.sort_order,
    }));
  }

  const base = mapListRow(row as Record<string, unknown>, structuredHours, coords);

  return {
    ...base,
    contactName: (row.contact_name as string | null) ?? null,
    paymentNotes: (row.payment_notes as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    structuredHours,
    gallery: (galleryRes.data ?? []).map((g) => ({
      id: g.id,
      imageUrl: g.image_url,
      caption: g.caption,
      sortOrder: g.sort_order,
    })),
    vendors: (vendorsRes.data ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      description: v.description,
      logoUrl: v.logo_url,
      websiteUrl: v.website_url,
      socialUrl: v.social_url,
      contactName: v.contact_name,
      contactEmail: v.contact_email,
      contactPhone: v.contact_phone,
      seasonalAvailability: v.seasonal_availability,
      sortOrder: v.sort_order,
      isActive: v.is_active,
      products: products.filter((p) => p.vendorId === v.id),
    })),
    announcements: (announcementsRes.data ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      announcementType: a.announcement_type as MarketAnnouncementType,
      startsAt: a.starts_at,
      endsAt: a.ends_at,
      isActive: a.is_active,
    })),
    events: (eventsRes.data ?? []).map((item) => {
      const event = item.events as { id: string; title: string; starts_at: string };
      return { id: event.id, title: event.title, subtitle: event.starts_at, href: "/events/$id", hrefParams: { id: event.id } };
    }),
    programs: (programsRes.data ?? []).map((item) => {
      const program = item.programs as { id: string; name: string; slug: string };
      return { id: program.id, title: program.name, href: "/programs/$slug", hrefParams: { slug: program.slug } };
    }),
    nearbyMarkets: allMarkets.filter((m) => m.id !== marketId && m.lat != null).slice(0, 6),
  };
}

export function filterMarkets(
  markets: MarketListItem[],
  search: string,
  productCategory: MarketProductCategory | null,
  savedOnly: boolean,
  savedIds: Set<string>,
  marketsWithCategory?: Set<string>,
) {
  const q = search.trim().toLowerCase();
  return markets.filter((market) => {
    const matchesSaved = !savedOnly || savedIds.has(market.id);
    const matchesCategory =
      !productCategory || (marketsWithCategory ? marketsWithCategory.has(market.id) : true);
    const matchesSearch =
      !q ||
      [market.name, market.description, market.city, market.state, market.address, market.season]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q));
    return matchesSaved && matchesCategory && matchesSearch;
  });
}

export function partitionMarkets(markets: MarketListItem[], now = new Date()) {
  const featured = markets.find((m) => m.isFeatured) ?? markets[0] ?? null;
  const rest = featured ? markets.filter((m) => m.id !== featured.id) : markets;
  const openToday = rest.filter((m) => m.isOpenToday);
  const thisWeekend = rest.filter((m) => !m.isOpenToday && m.isOpenThisWeekend);
  const seasonal = rest.filter((m) => m.season && !openToday.includes(m) && !thisWeekend.includes(m));
  const nearMe = [...rest]
    .filter((m) => m.distanceKm != null)
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  const other = rest.filter(
    (m) => !openToday.includes(m) && !thisWeekend.includes(m) && !seasonal.includes(m),
  );
  return { featured, nearMe, openToday, thisWeekend, seasonal, other };
}

export async function fetchAdminMarkets() {
  const { data, error } = await supabase.from("markets").select(listSelect).order("name");
  if (error) throw error;
  const hoursMap = await fetchHoursForMarkets((data ?? []).map((r) => r.id));
  return (data ?? []).map((row) => mapListRow(row as Record<string, unknown>, hoursMap.get(row.id) ?? []));
}

export function emptyMarketForm(): MarketFormData {
  return {
    slug: "",
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    lat: "",
    lng: "",
    hours: "",
    season: "",
    coverImageUrl: "",
    phone: "",
    email: "",
    websiteUrl: "",
    contactName: "",
    acceptsSnapEbt: false,
    acceptsCredit: false,
    parkingInfo: "",
    paymentNotes: "",
    isFeatured: false,
    isActive: true,
    structuredHours: DAY_LABELS.map((_, index) => ({
      dayOfWeek: index,
      opensAt: "",
      closesAt: "",
      isClosed: index === 0,
      sortOrder: index,
    })),
    gallery: [],
    vendors: [],
    announcements: [],
    eventIds: [],
    programIds: [],
  };
}

export async function fetchAdminMarketForm(marketId: string): Promise<MarketFormData> {
  const { data: row, error } = await supabase.from("markets").select("*").eq("id", marketId).single();
  if (error) throw error;

  const [hoursRes, galleryRes, vendorsRes, announcementsRes, eventsRes, programsRes] = await Promise.all([
    supabase.from("market_hours").select("*").eq("market_id", marketId).order("day_of_week"),
    supabase.from("market_images").select("*").eq("market_id", marketId).order("sort_order"),
    supabase.from("market_vendors").select("*").eq("market_id", marketId).order("sort_order"),
    supabase.from("market_announcements").select("*").eq("market_id", marketId).order("created_at", { ascending: false }),
    supabase.from("market_events").select("event_id").eq("market_id", marketId),
    supabase.from("market_programs").select("program_id").eq("market_id", marketId),
  ]);

  for (const res of [hoursRes, galleryRes, vendorsRes, announcementsRes, eventsRes, programsRes]) {
    if (res.error) throw res.error;
  }

  const vendorIds = (vendorsRes.data ?? []).map((v) => v.id);
  let vendorProducts: MarketProduct[] = [];
  if (vendorIds.length > 0) {
    const { data: products, error: productsError } = await supabase
      .from("market_products")
      .select("*")
      .in("vendor_id", vendorIds)
      .order("sort_order");
    if (productsError) throw productsError;
    vendorProducts = (products ?? []).map((p) => ({
      id: p.id,
      vendorId: p.vendor_id,
      name: p.name,
      category: p.category as MarketProductCategory,
      description: p.description,
      availableToday: p.available_today,
      season: p.season,
      isOrganic: p.is_organic,
      isLocal: p.is_local,
      sortOrder: p.sort_order,
    }));
  }

  return {
    slug: row.slug ?? "",
    name: row.name,
    description: row.description ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    lat: row.lat != null ? String(row.lat) : "",
    lng: row.lng != null ? String(row.lng) : "",
    hours: row.hours ?? "",
    season: row.season ?? "",
    coverImageUrl: row.image_url ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    websiteUrl: row.website_url ?? "",
    contactName: row.contact_name ?? "",
    acceptsSnapEbt: row.accepts_snap_ebt,
    acceptsCredit: row.accepts_credit,
    parkingInfo: row.parking_info ?? "",
    paymentNotes: row.payment_notes ?? "",
    isFeatured: row.is_featured,
    isActive: row.is_active,
    structuredHours:
      (hoursRes.data ?? []).length > 0
        ? (hoursRes.data ?? []).map((h) => ({
            id: h.id,
            dayOfWeek: h.day_of_week,
            opensAt: h.opens_at ?? "",
            closesAt: h.closes_at ?? "",
            isClosed: h.is_closed,
            sortOrder: h.sort_order,
          }))
        : emptyMarketForm().structuredHours,
    gallery: (galleryRes.data ?? []).map((g) => ({
      id: g.id,
      imageUrl: g.image_url,
      caption: g.caption ?? "",
      sortOrder: g.sort_order,
    })),
    vendors: (vendorsRes.data ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      description: v.description ?? "",
      logoUrl: v.logo_url ?? "",
      websiteUrl: v.website_url ?? "",
      socialUrl: v.social_url ?? "",
      contactName: v.contact_name ?? "",
      contactEmail: v.contact_email ?? "",
      contactPhone: v.contact_phone ?? "",
      seasonalAvailability: v.seasonal_availability ?? "",
      sortOrder: v.sort_order,
      isActive: v.is_active,
      products: vendorProducts.filter((p) => p.vendorId === v.id),
    })),
    announcements: (announcementsRes.data ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body ?? "",
      announcementType: a.announcement_type as MarketAnnouncementType,
      startsAt: a.starts_at ? new Date(a.starts_at).toISOString().slice(0, 16) : "",
      endsAt: a.ends_at ? new Date(a.ends_at).toISOString().slice(0, 16) : "",
      isActive: a.is_active,
    })),
    eventIds: (eventsRes.data ?? []).map((r) => r.event_id),
    programIds: (programsRes.data ?? []).map((r) => r.program_id),
  };
}

async function replaceMarketRelations(marketId: string, form: MarketFormData) {
  await Promise.all([
    supabase.from("market_hours").delete().eq("market_id", marketId),
    supabase.from("market_images").delete().eq("market_id", marketId),
    supabase.from("market_vendors").delete().eq("market_id", marketId),
    supabase.from("market_announcements").delete().eq("market_id", marketId),
    supabase.from("market_events").delete().eq("market_id", marketId),
    supabase.from("market_programs").delete().eq("market_id", marketId),
  ]);

  if (form.structuredHours.length) {
    const { error } = await supabase.from("market_hours").insert(
      form.structuredHours.map((hour, index) => ({
        market_id: marketId,
        day_of_week: hour.dayOfWeek,
        opens_at: hour.opensAt || null,
        closes_at: hour.closesAt || null,
        is_closed: hour.isClosed,
        sort_order: index,
      })),
    );
    if (error) throw error;
  }

  if (form.gallery.length) {
    const { error } = await supabase.from("market_images").insert(
      form.gallery.map((image, index) => ({
        market_id: marketId,
        image_url: image.imageUrl,
        caption: image.caption || null,
        sort_order: index,
      })),
    );
    if (error) throw error;
  }

  for (const [vendorIndex, vendor] of form.vendors.entries()) {
    const vendorSlug = vendor.slug || slugify(vendor.name) || `vendor-${vendorIndex}`;
    const { data: vendorRow, error: vendorError } = await supabase
      .from("market_vendors")
      .insert({
        market_id: marketId,
        name: vendor.name,
        slug: vendorSlug,
        description: vendor.description || null,
        logo_url: vendor.logoUrl || null,
        website_url: vendor.websiteUrl || null,
        social_url: vendor.socialUrl || null,
        contact_name: vendor.contactName || null,
        contact_email: vendor.contactEmail || null,
        contact_phone: vendor.contactPhone || null,
        seasonal_availability: vendor.seasonalAvailability || null,
        sort_order: vendorIndex,
        is_active: vendor.isActive,
      })
      .select("id")
      .single();
    if (vendorError) throw vendorError;

    if (vendor.products.length) {
      const { error: productsError } = await supabase.from("market_products").insert(
        vendor.products.map((product, index) => ({
          vendor_id: vendorRow.id,
          name: product.name,
          category: product.category,
          description: product.description || null,
          available_today: product.availableToday,
          season: product.season || null,
          is_organic: product.isOrganic,
          is_local: product.isLocal,
          sort_order: index,
        })),
      );
      if (productsError) throw productsError;
    }
  }

  if (form.announcements.length) {
    const { error } = await supabase.from("market_announcements").insert(
      form.announcements.map((announcement) => ({
        market_id: marketId,
        title: announcement.title,
        body: announcement.body || null,
        announcement_type: announcement.announcementType,
        starts_at: announcement.startsAt || null,
        ends_at: announcement.endsAt || null,
        is_active: announcement.isActive,
      })),
    );
    if (error) throw error;
  }

  if (form.eventIds.length) {
    const { error } = await supabase.from("market_events").insert(
      form.eventIds.map((eventId, index) => ({ market_id: marketId, event_id: eventId, sort_order: index })),
    );
    if (error) throw error;
  }

  if (form.programIds.length) {
    const { error } = await supabase.from("market_programs").insert(
      form.programIds.map((programId, index) => ({ market_id: marketId, program_id: programId, sort_order: index })),
    );
    if (error) throw error;
  }
}

export async function saveMarket(marketId: string | null, form: MarketFormData) {
  const slug = form.slug.trim() || slugify(form.name);
  const payload = {
    slug,
    name: form.name,
    description: form.description || null,
    address: form.address || null,
    city: form.city || null,
    state: form.state || null,
    lat: form.lat ? Number(form.lat) : null,
    lng: form.lng ? Number(form.lng) : null,
    hours: form.hours || null,
    season: form.season || null,
    image_url: form.coverImageUrl || null,
    phone: form.phone || null,
    email: form.email || null,
    website_url: form.websiteUrl || null,
    contact_name: form.contactName || null,
    accepts_snap_ebt: form.acceptsSnapEbt,
    accepts_credit: form.acceptsCredit,
    parking_info: form.parkingInfo || null,
    payment_notes: form.paymentNotes || null,
    is_featured: form.isFeatured,
    is_active: form.isActive,
  };

  if (marketId) {
    const { error } = await supabase.from("markets").update(payload).eq("id", marketId);
    if (error) throw error;
    await replaceMarketRelations(marketId, form);
    return marketId;
  }

  const { data, error } = await supabase.from("markets").insert(payload).select("id").single();
  if (error) throw error;
  await replaceMarketRelations(data.id, form);
  return data.id;
}

export async function deleteMarket(marketId: string) {
  const { error } = await supabase.from("markets").delete().eq("id", marketId);
  if (error) throw error;
}

export async function fetchUserFavoriteMarketIds(userId: string) {
  const { data, error } = await supabase.from("favorites").select("market_id").eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.market_id));
}

export async function toggleFavoriteMarket(userId: string, marketId: string, favorite: boolean) {
  if (favorite) {
    const { error } = await supabase.from("favorites").insert({ user_id: userId, market_id: marketId });
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("market_id", marketId);
  if (error) throw error;
}

export async function fetchMarketIdsByProductCategory(category: MarketProductCategory) {
  const { data, error } = await supabase
    .from("market_products")
    .select("vendor_id, market_vendors!inner(market_id)")
    .eq("category", category);
  if (error) throw error;
  return new Set(
    (data ?? []).map((row) => (row.market_vendors as { market_id: string }).market_id),
  );
}

export async function getMarketAnalytics() {
  const [markets, vendors, products, favorites] = await Promise.all([
    supabase.from("markets").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("market_vendors").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("market_products").select("id", { count: "exact", head: true }),
    supabase.from("favorites").select("market_id", { count: "exact", head: true }),
  ]);
  return {
    activeMarkets: markets.count ?? 0,
    activeVendors: vendors.count ?? 0,
    products: products.count ?? 0,
    favorites: favorites.count ?? 0,
  };
}
