import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
});
export const insightsFiltersSchema = z.object({
  from: date.optional(), to: date.optional(),
  type: z.enum(['all', 'event', 'market']).default('all'),
  institution: z.union([z.literal('all'), z.literal('unassigned'), z.string().uuid()]).default('all'),
  view: z.enum(['coverage', 'quality']).default('coverage'),
}).refine(value => !value.from || !value.to || value.from <= value.to, { message: 'Start date must be on or before end date.' });
export type InsightsFilters = z.infer<typeof insightsFiltersSchema>;
export type CoveragePlace = {
  id: string; kind: 'event' | 'market'; name: string; place: string | null;
  lat: number | null; lng: number | null; county: null;
  institutionIds: string[]; startsAt: string | null; endsAt: string | null;
  hasLocation: boolean;
};
export function validCoordinates(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}
export function explicitInstitutionIds(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== 'object') return [];
  const values = metadata as Record<string, unknown>;
  const ids = Array.isArray(values.institution_ids) ? values.institution_ids : [values.institution_id];
  return [...new Set(ids.filter((id): id is string => typeof id === 'string' && z.string().uuid().safeParse(id).success))];
}
export function eligibleEvent(event: { status: string; is_active: boolean }): boolean {
  return event.status === 'published' && event.is_active;
}
export function filterPlaces(places: CoveragePlace[], filters: InsightsFilters): CoveragePlace[] {
  const from = filters.from ? Date.parse(`${filters.from}T00:00:00Z`) : null;
  const until = filters.to ? Date.parse(`${filters.to}T00:00:00Z`) + 86_400_000 : null;
  return places.filter(place => {
    if (filters.type !== 'all' && place.kind !== filters.type) return false;
    if (filters.institution === 'unassigned' && place.institutionIds.length) return false;
    if (!['all', 'unassigned'].includes(filters.institution) && !place.institutionIds.includes(filters.institution)) return false;
    if (place.kind === 'market' || (from === null && until === null)) return true;
    const start = Date.parse(place.startsAt ?? '');
    const end = Date.parse(place.endsAt ?? place.startsAt ?? '');
    if (!Number.isFinite(start)) return false;
    // A point event includes its start; interval ends are exclusive.
    return (until === null || start < until) && (from === null || (end > start ? end > from : start >= from));
  });
}
export function qualityIssues(place: CoveragePlace): string[] {
  const issues: string[] = [];
  if (place.lat == null || place.lng == null) issues.push('Missing coordinates');
  else if (!validCoordinates(place.lat, place.lng)) issues.push('Invalid coordinates');
  if (!place.hasLocation) issues.push('Missing location');
  if (!place.place) issues.push('Missing named place');
  issues.push('County not recorded');
  return issues;
}
export function coverageSummary(places: CoveragePlace[]) {
  const groups = new Map<string, { place: string; events: number; markets: number; mapped: number }>();
  for (const record of places) {
    const name = record.place?.trim() || 'Place not recorded';
    const group = groups.get(name) ?? { place: name, events: 0, markets: 0, mapped: 0 };
    if (record.kind === 'event') group.events++; else group.markets++;
    if (validCoordinates(record.lat, record.lng)) group.mapped++;
    groups.set(name, group);
  }
  return [...groups.values()].sort((a, b) => a.place.localeCompare(b.place));
}
/** Called before any dashboard query; never authorize from client state. */
export function assertInsightsAdmin(allowed: unknown, error?: unknown): void {
  if (error || allowed !== true) throw new Error('Administrator access required.');
}