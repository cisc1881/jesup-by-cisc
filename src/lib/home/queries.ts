import { supabase } from "@/integrations/supabase/client";
import { fetchFeaturedNewsArticle, fetchNewsArticles } from "@/lib/news";
import { fetchFeaturedPodcastEpisode } from "@/lib/podcasts";
import { fetchPartners } from "@/lib/partners";
import { fetchPublications } from "@/lib/publications";
import { fetchHomePrograms } from "./programs-source";
import { DEFAULT_IMPACT_METRICS, fetchHomeSectionMeta } from "./section-config";
import type {
  HomeCta,
  HomeEvent,
  HomeHeroSlide,
  HomeImpactStat,
  HomeMarket,
  HomePageData,
  HomePodcastEpisode,
  HomePublication,
  HomeNewsArticle,
} from "./types";

const now = () => new Date().toISOString();

async function countTable(table: "events" | "publications" | "markets" | "partners", filter?: { column: string; op: string; value: unknown }) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) {
    query = query.filter(filter.column, filter.op, filter.value);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function fetchHomeHeroSlides(limit = 5): Promise<HomeHeroSlide[]> {
  const [eventsRes, marketsRes, podcastRes, programsRes] = await Promise.all([
    supabase
      .from("events")
      .select("id,title,description,image_url,starts_at")
      .eq("status", "published")
      .eq("is_active", true)
      .not("image_url", "is", null)
      .gte("starts_at", now())
      .order("starts_at", { ascending: true })
      .limit(limit),
    supabase
      .from("markets")
      .select("id,name,description,image_url")
      .eq("is_active", true)
      .not("image_url", "is", null)
      .order("name")
      .limit(limit),
    supabase
      .from("podcast_episodes")
      .select("id,slug,title,description,cover_url")
      .eq("is_published", true)
      .not("cover_url", "is", null)
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from("programs")
      .select("id,slug,name,tagline,cover_image_url")
      .eq("is_active", true)
      .eq("is_featured", true)
      .not("cover_image_url", "is", null)
      .order("sort_order", { ascending: true })
      .limit(limit),
  ]);

  const slides: HomeHeroSlide[] = [];

  for (const e of eventsRes.data ?? []) {
    if (!e.image_url) continue;
    slides.push({
      id: `event-${e.id}`,
      imageUrl: e.image_url,
      imageAlt: e.title,
      title: e.title,
      subtitle: e.description,
      linkTo: "/events/$id",
      linkParams: { id: e.id },
      linkLabel: e.title,
    });
  }

  for (const m of marketsRes.data ?? []) {
    if (!m.image_url) continue;
    slides.push({
      id: `market-${m.id}`,
      imageUrl: m.image_url,
      imageAlt: m.name,
      title: m.name,
      subtitle: m.description,
      linkTo: "/markets/$id",
      linkParams: { id: m.id },
      linkLabel: m.name,
    });
  }

  for (const p of podcastRes.data ?? []) {
    if (!p.cover_url) continue;
    slides.push({
      id: `podcast-${p.id}`,
      imageUrl: p.cover_url,
      imageAlt: p.title,
      title: p.title,
      subtitle: p.description,
      linkTo: "/podcasts/$slug",
      linkParams: { slug: p.slug },
      linkLabel: p.title,
    });
  }

  for (const p of programsRes.data ?? []) {
    if (!p.cover_image_url) continue;
    slides.push({
      id: `program-${p.id}`,
      imageUrl: p.cover_image_url,
      imageAlt: p.name,
      title: p.name,
      subtitle: p.tagline,
      linkTo: "/programs/$slug",
      linkParams: { slug: p.slug },
      linkLabel: p.name,
    });
  }

  return slides.slice(0, limit);
}

export async function fetchHomeEvents(limit = 6): Promise<HomeEvent[]> {
  const { fetchEvents } = await import("@/lib/events");
  const events = await fetchEvents({ upcomingOnly: true, featuredOnly: false, limit });
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    startsAt: e.startsAt,
    location: e.location,
    imageUrl: e.coverImageUrl,
    registrationOpen: e.registrationOpen,
  }));
}

export async function fetchHomePublications(limit = 4): Promise<HomePublication[]> {
  const featured = await fetchPublications({ featuredOnly: true, limit });
  if (featured.length >= limit) return featured.slice(0, limit);

  const latest = await fetchPublications({ limit });
  const merged = [...featured];
  for (const pub of latest) {
    if (merged.length >= limit) break;
    if (!merged.some((f) => f.id === pub.id)) merged.push(pub);
  }
  return merged;
}

export async function fetchFeaturedPodcast(): Promise<HomePodcastEpisode | null> {
  const episode = await fetchFeaturedPodcastEpisode();
  if (!episode) return null;
  return {
    id: episode.id,
    slug: episode.slug,
    title: episode.title,
    description: episode.description,
    coverUrl: episode.coverUrl,
    guest: episode.guest,
    durationSeconds: episode.durationSeconds,
    publishedAt: episode.publishedAt,
  };
}

function mapHomeNewsArticle(article: Awaited<ReturnType<typeof fetchNewsArticles>>[number]): HomeNewsArticle {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    author: article.author,
    category: article.category,
    coverImageUrl: article.coverImageUrl,
    publishedAt: article.publishedAt,
    isFeatured: article.isFeatured,
    readingTimeMinutes: article.readingTimeMinutes,
    tags: article.tags,
  };
}

export async function fetchHomeNews(limit = 4) {
  const featured = await fetchFeaturedNewsArticle();
  const articles = await fetchNewsArticles({ limit: limit + 1 });
  const featuredArticle = featured ? mapHomeNewsArticle(featured) : null;
  const latest = articles
    .filter((a) => !featuredArticle || a.id !== featuredArticle.id)
    .slice(0, limit)
    .map(mapHomeNewsArticle);
  return { featured: featuredArticle, latest };
}

export async function fetchHomePartners(limit = 6) {
  const featured = await fetchPartners({ featuredOnly: true, limit });
  if (featured.length >= limit) {
    return featured.slice(0, limit).map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      logoUrl: p.logoUrl,
      category: p.category,
      isFeatured: p.isFeatured,
    }));
  }

  const all = await fetchPartners({ limit: limit * 2 });
  const merged = [...featured];
  for (const partner of all) {
    if (merged.length >= limit) break;
    if (!merged.some((m) => m.id === partner.id)) merged.push(partner);
  }

  return merged.slice(0, limit).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    logoUrl: p.logoUrl,
    category: p.category,
    isFeatured: p.isFeatured,
  }));
}

export async function fetchHomeMarkets() {
  const { fetchMarkets } = await import("@/lib/markets");
  return fetchMarkets({ activeOnly: true });
}

export async function fetchHomeImpactStats(): Promise<HomeImpactStat[]> {
  const [upcomingEvents, publications, markets, partners] = await Promise.all([
    countTable("events", { column: "starts_at", op: "gte", value: now() }),
    countTable("publications", { column: "is_active", op: "eq", value: true }),
    countTable("markets", { column: "is_active", op: "eq", value: true }),
    supabase
      .from("partners")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)
      .then(({ count, error }) => {
        if (error) throw error;
        return count ?? 0;
      }),
  ]);

  const values: Record<string, number> = {
    events: upcomingEvents,
    publications,
    markets,
    partners,
  };

  return DEFAULT_IMPACT_METRICS.map((metric) => ({
    id: metric.id,
    label: metric.label,
    value: values[metric.id] ?? 0,
  }));
}

export function resolveHomeCta(events: HomeEvent[], podcast: HomePodcastEpisode | null): HomeCta | null {
  const nextEvent = events[0];
  if (nextEvent) {
    return {
      eyebrow: nextEvent.startsAt ? new Date(nextEvent.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null,
      title: nextEvent.title,
      body: nextEvent.location,
      linkTo: "/events/$id",
      linkParams: { id: nextEvent.id },
      buttonLabel: nextEvent.title,
    };
  }

  if (podcast) {
    return {
      eyebrow: podcast.guest,
      title: podcast.title,
      body: podcast.description,
      linkTo: "/podcasts/$slug",
      linkParams: { slug: podcast.slug },
      buttonLabel: podcast.title,
    };
  }

  return null;
}

/** Haversine distance in km between two lat/lng points. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function pickNearestMarket(markets: HomeMarket[], coords: { lat: number; lng: number } | null): HomeMarket | null {
  const withCoords = markets.filter((m) => m.lat != null && m.lng != null);
  if (withCoords.length === 0) return markets[0] ?? null;
  if (!coords) return withCoords[0] ?? markets[0] ?? null;

  return withCoords.reduce((best, m) => {
    const d = distanceKm(coords, { lat: m.lat!, lng: m.lng! });
    const bestD = distanceKm(coords, { lat: best.lat!, lng: best.lng! });
    return d < bestD ? m : best;
  });
}

export async function fetchHomePageData(): Promise<HomePageData> {
  const [heroSlides, programs, events, publications, featuredPodcast, homeNews, partners, markets, impactStats, sections] =
    await Promise.all([
      fetchHomeHeroSlides(),
      fetchHomePrograms(6),
      fetchHomeEvents(),
      fetchHomePublications(),
      fetchFeaturedPodcast(),
      fetchHomeNews(4),
      fetchHomePartners(6),
      fetchHomeMarkets(),
      fetchHomeImpactStats(),
      fetchHomeSectionMeta(),
    ]);

  return {
    heroSlides,
    programs,
    events,
    publications,
    featuredPodcast,
    featuredNews: homeNews.featured,
    latestNews: homeNews.latest,
    partners,
    markets,
    impactStats,
    sections,
    cta: resolveHomeCta(events, featuredPodcast),
  };
}
