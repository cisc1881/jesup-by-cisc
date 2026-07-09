import { supabase } from "@/integrations/supabase/client";
import type { SearchResult } from "./types";

function matchesQuery(text: string | null | undefined, q: string) {
  return text?.toLowerCase().includes(q) ?? false;
}

function scoreMatch(text: string | null | undefined, q: string) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  if (lower === q) return 100;
  if (lower.startsWith(q)) return 80;
  if (lower.includes(q)) return 50;
  return 0;
}

/**
 * Global search across all CMS content types.
 * Designed for future AI-enhanced semantic search.
 */
export async function globalSearch(query: string, limit = 30): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const [programs, events, markets, publications, podcasts, partners, grants] = await Promise.all([
    supabase.from("programs").select("id,slug,name,tagline,cover_image_url").eq("is_active", true),
    supabase.from("events").select("id,title,description,location,image_url").eq("is_active", true),
    supabase.from("markets").select("id,slug,name,description,city,state,image_url").eq("is_active", true),
    supabase.from("publications").select("id,slug,title,summary,cover_image_url").eq("is_active", true),
    supabase.from("podcast_episodes").select("id,slug,title,description,guest,cover_url").eq("is_published", true),
    supabase.from("partners").select("id,name,description,logo_url").eq("is_published", true),
    supabase.from("grants").select("id,title,funder,description").order("title"),
  ]);

  const results: SearchResult[] = [];

  for (const p of programs.data ?? []) {
    const fields = [p.name, p.tagline];
    if (!fields.some((f) => matchesQuery(f, q))) continue;
    results.push({
      id: p.id,
      entityType: "program",
      title: p.name,
      subtitle: p.tagline,
      href: "/programs/$slug",
      hrefParams: { slug: p.slug },
      imageUrl: p.cover_image_url,
      score: Math.max(...fields.map((f) => scoreMatch(f, q))),
    });
  }

  for (const e of events.data ?? []) {
    const fields = [e.title, e.description, e.location];
    if (!fields.some((f) => matchesQuery(f, q))) continue;
    results.push({
      id: e.id,
      entityType: "event",
      title: e.title,
      subtitle: e.location,
      href: "/events/$id",
      hrefParams: { id: e.id },
      imageUrl: e.image_url,
      score: Math.max(...fields.map((f) => scoreMatch(f, q))),
    });
  }

  for (const m of markets.data ?? []) {
    const fields = [m.name, m.description, m.city, m.state];
    if (!fields.some((f) => matchesQuery(f, q))) continue;
    results.push({
      id: m.id,
      entityType: "market",
      title: m.name,
      subtitle: [m.city, m.state].filter(Boolean).join(", ") || null,
      href: "/markets/$id",
      hrefParams: { id: m.id },
      imageUrl: m.image_url,
      score: Math.max(...fields.map((f) => scoreMatch(f, q))),
    });
  }

  for (const p of publications.data ?? []) {
    const fields = [p.title, p.summary];
    if (!fields.some((f) => matchesQuery(f, q))) continue;
    results.push({
      id: p.id,
      entityType: "publication",
      title: p.title,
      subtitle: p.summary,
      href: "/publications/$slug",
      hrefParams: { slug: p.slug },
      imageUrl: p.cover_image_url,
      score: Math.max(...fields.map((f) => scoreMatch(f, q))),
    });
  }

  for (const p of podcasts.data ?? []) {
    const fields = [p.title, p.description, p.guest];
    if (!fields.some((f) => matchesQuery(f, q))) continue;
    results.push({
      id: p.id,
      entityType: "podcast",
      title: p.title,
      subtitle: p.guest,
      href: "/podcast",
      imageUrl: p.cover_url,
      score: Math.max(...fields.map((f) => scoreMatch(f, q))),
    });
  }

  for (const p of partners.data ?? []) {
    const fields = [p.name, p.description];
    if (!fields.some((f) => matchesQuery(f, q))) continue;
    results.push({
      id: p.id,
      entityType: "partner",
      title: p.name,
      subtitle: p.description,
      href: "/partners",
      imageUrl: p.logo_url,
      score: Math.max(...fields.map((f) => scoreMatch(f, q))),
    });
  }

  for (const g of grants.data ?? []) {
    const fields = [g.title, g.funder, g.description];
    if (!fields.some((f) => matchesQuery(f, q))) continue;
    results.push({
      id: g.id,
      entityType: "grant",
      title: g.title,
      subtitle: g.funder,
      href: "/grants",
      imageUrl: null,
      score: Math.max(...fields.map((f) => scoreMatch(f, q))),
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
