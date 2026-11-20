import { eventPhase, type EventPhase } from "@/lib/event-phase";

export type HomeEventRegistration = {
  status: string;
  events: {
    starts_at: string;
    ends_at: string | null;
  } | null;
};

/** Prioritize a live event, then the next event, then a recently completed one. */
export function selectHomeEventRegistration<T extends HomeEventRegistration>(
  registrations: T[],
  now = Date.now(),
): { registration: T; phase: EventPhase } | null {
  const candidates = registrations
    .filter((item) => item.status !== "cancelled" && item.events)
    .map((registration) => {
      const start = Date.parse(registration.events!.starts_at);
      const parsedEnd = registration.events!.ends_at
        ? Date.parse(registration.events!.ends_at)
        : NaN;
      const end = Number.isFinite(parsedEnd) ? parsedEnd : start + 24 * 60 * 60 * 1000;
      return { registration, start, end };
    })
    .filter(({ start, end }) => Number.isFinite(start) && end > now - 30 * 24 * 60 * 60 * 1000)
    .sort((a, b) => {
      const rank = (item: typeof a) =>
        item.start <= now && item.end >= now ? 0 : item.start > now ? 1 : 2;
      const difference = rank(a) - rank(b);
      if (difference) return difference;
      return rank(a) === 2 ? b.end - a.end : a.start - b.start;
    });
  const selected = candidates[0];
  if (!selected) return null;
  return {
    registration: selected.registration,
    phase: eventPhase(
      selected.registration.events!.starts_at,
      selected.registration.events!.ends_at,
      new Date(now),
    ),
  };
}
