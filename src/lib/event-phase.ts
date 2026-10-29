export type EventPhase = "before" | "during" | "after";

export function eventPhase(startsAt: string, endsAt: string | null, now = new Date()): EventPhase {
  const start = Date.parse(startsAt);
  const end = endsAt ? Date.parse(endsAt) : start + 24 * 60 * 60 * 1000;
  if (now.getTime() < start) return "before";
  if (now.getTime() <= end) return "during";
  return "after";
}
