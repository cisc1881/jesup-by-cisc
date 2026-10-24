import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { assertInsightsAdmin, explicitInstitutionIds, filterPlaces, insightsFiltersSchema, type CoveragePlace } from './extension-insights';

export const getExtensionInsights = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(insightsFiltersSchema)
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const role = await db.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    assertInsightsAdmin(role.data, role.error);
    const places: CoveragePlace[] = [];
    // Page narrow venue reads; never silently use the Data API's default row limit.
    for (let offset = 0; ; offset += 500) {
      const result = await db.from('events').select('id,title,location,location_address,lat,lng,starts_at,ends_at,metadata')
        .eq('status', 'published').eq('is_active', true).order('id').range(offset, offset + 499);
      if (result.error) throw new Error('Event coverage could not be loaded.');
      const rows = result.data ?? [];
      places.push(...rows.map(row => ({ id: row.id, kind: 'event' as const, name: row.title,
        place: row.location?.trim() || null, hasLocation: Boolean(row.location?.trim() || row.location_address?.trim()),
        lat: row.lat, lng: row.lng, county: null, institutionIds: explicitInstitutionIds(row.metadata), startsAt: row.starts_at, endsAt: row.ends_at })));
      if (rows.length < 500) break;
    }
    for (let offset = 0; ; offset += 500) {
      const result = await db.from('markets').select('id,name,city,state,address,lat,lng').eq('is_active', true).order('id').range(offset, offset + 499);
      if (result.error) throw new Error('Market coverage could not be loaded.');
      const rows = result.data ?? [];
      places.push(...rows.map(row => ({ id: row.id, kind: 'market' as const, name: row.name,
        place: [row.city?.trim(), row.state?.trim()].filter(Boolean).join(', ') || null,
        hasLocation: Boolean(row.city?.trim() || row.state?.trim() || row.address?.trim()),
        lat: row.lat, lng: row.lng, county: null, institutionIds: [], startsAt: null, endsAt: null })));
      if (rows.length < 500) break;
    }
    // Fetch only explicit event-associated institution labels, never attendee institutions.
    const institutionIds = [...new Set(places.flatMap(place => place.institutionIds))];
    const institutions: { id: string; name: string }[] = [];
    for (let offset = 0; offset < institutionIds.length; offset += 100) {
      const result = await db.from('institutions').select('id,name').in('id', institutionIds.slice(offset, offset + 100));
      if (result.error) throw new Error('Institution labels could not be loaded.');
      institutions.push(...(result.data ?? []));
    }
    const selected = filterPlaces(places, data);
    const eventIds = selected.filter(place => place.kind === 'event').map(place => place.id);
    let registrations = 0, cancelled = 0, checkedIn = 0;
    for (let offset = 0; offset < eventIds.length; offset += 100) {
      const ids = eventIds.slice(offset, offset + 100);
      const results = await Promise.all([
        db.from('event_registrations').select('id', { count: 'exact', head: true }).in('event_id', ids),
        db.from('event_registrations').select('id', { count: 'exact', head: true }).in('event_id', ids).eq('status', 'cancelled'),
        db.from('event_registrations').select('id', { count: 'exact', head: true }).in('event_id', ids).neq('status', 'cancelled').not('checked_in_at', 'is', null),
      ]);
      if (results.some(result => result.error || result.count === null)) throw new Error('Registration metrics could not be loaded.');
      registrations += results[0]?.count ?? 0;
      cancelled += results[1]?.count ?? 0;
      checkedIn += results[2]?.count ?? 0;
    }
    return { places: selected, institutions, metrics: { registrations, cancelled, checkedIn }, updatedAt: new Date().toISOString() };
  });