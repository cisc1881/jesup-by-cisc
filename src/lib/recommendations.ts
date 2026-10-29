import type { HomeEvent, HomeProgram } from "@/lib/home";

export type RecommendationInput = { role: string | null; interests: string[] };
export type Recommendation = {
  type: "event" | "program";
  id: string;
  title: string;
  href: string;
  reason: string;
  score: number;
};

export function recommendHomeContent(
  input: RecommendationInput,
  events: HomeEvent[],
  programs: HomeProgram[],
): Recommendation[] {
  const terms = [...input.interests, input.role ?? ""]
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (terms.length === 0) return [];
  const candidates: Recommendation[] = [
    ...events.map((event) => ({
      type: "event" as const,
      id: event.id,
      title: event.title,
      href: `/events/${event.id}/hub`,
      description: `${event.title} ${event.location ?? ""}`,
    })),
    ...programs.map((program) => ({
      type: "program" as const,
      id: program.slug,
      title: program.name,
      href: `/programs/${program.slug}`,
      description: `${program.name} ${program.short} ${program.tagline} ${program.categoryName ?? ""}`,
    })),
  ].map((candidate) => {
    const haystack = candidate.description.toLowerCase();
    const matches = terms.filter((term) => haystack.includes(term));
    return {
      type: candidate.type,
      id: candidate.id,
      title: candidate.title,
      href: candidate.href,
      reason: matches.length ? `Matches ${matches[0]}` : "",
      score: matches.length,
    };
  });
  return candidates
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 4);
}
