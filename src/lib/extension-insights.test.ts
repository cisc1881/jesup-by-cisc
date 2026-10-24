import { describe, expect, it } from 'vitest';
import { assertInsightsAdmin, coverageSummary, eligibleEvent, explicitInstitutionIds, filterPlaces, insightsFiltersSchema, qualityIssues, validCoordinates, type CoveragePlace } from './extension-insights';
const institution = '11111111-1111-4111-8111-111111111111';
const event: CoveragePlace = { id: 'event', kind: 'event', name: 'Conference', place: 'Campus', lat: 32.43, lng: -85.71, county: null, institutionIds: [institution], startsAt: '2027-02-18T06:00:00Z', endsAt: '2027-02-20T06:00:00Z', hasLocation: true };
const market: CoveragePlace = { ...event, id: 'market', kind: 'market', institutionIds: [], startsAt: null, endsAt: null };
const filters = insightsFiltersSchema.parse({});
describe('Extension Insights boundaries', () => {
  it('requires a published active event', () => {
    expect(eligibleEvent({ status: 'published', is_active: true })).toBe(true);
    expect(eligibleEvent({ status: 'draft', is_active: true })).toBe(false);
    expect(eligibleEvent({ status: 'published', is_active: false })).toBe(false);
  });
  it('rejects missing, nonfinite and out of range coordinates but permits zero', () => {
    for (const [lat, lng] of [[null, 1], [1, undefined], [NaN, 1], [Infinity, 1], [91, 1], [1, -181], ['32', 1]]) expect(validCoordinates(lat, lng)).toBe(false);
    expect(validCoordinates(0, 0)).toBe(true);
    expect(validCoordinates(-90, 180)).toBe(true);
  });
  it('keeps overlap and exclusive end boundaries, never filters markets by event dates', () => {
    expect(filterPlaces([event, market], { ...filters, from: '2027-02-19', to: '2027-02-19' }).length).toBe(2);
    expect(filterPlaces([{ ...event, endsAt: '2027-02-19T00:00:00Z' }, market], { ...filters, from: '2027-02-19' }).map(p => p.id)).toEqual(['market']);
    expect(filterPlaces([event, market], { ...filters, to: '2027-02-17' }).map(p => p.id)).toEqual(['market']);
  });
  it('rejects invalid and reversed calendar ranges', () => {
    expect(insightsFiltersSchema.safeParse({ from: '2027-02-30' }).success).toBe(false);
    expect(insightsFiltersSchema.safeParse({ from: '2027-03-01', to: '2027-02-01' }).success).toBe(false);
  });
  it('attributes institutions only from explicit event metadata', () => {
    expect(explicitInstitutionIds({ institution_ids: [institution, institution, 'bad'], location: 'Tuskegee' })).toEqual([institution]);
    expect(explicitInstitutionIds({ institution_id: institution })).toEqual([institution]);
    expect(explicitInstitutionIds({ location: 'Tuskegee', network_wide: true })).toEqual([]);
    expect(filterPlaces([event, market], { ...filters, institution }).map(p => p.id)).toEqual(['event']);
    expect(filterPlaces([event, market], { ...filters, institution: 'unassigned' }).map(p => p.id)).toEqual(['market']);
  });
  it('flags county as not recorded even with a valid venue point', () => {
    expect(qualityIssues(event)).toEqual(['County not recorded']);
    expect(qualityIssues({ ...event, lat: null, place: null, hasLocation: false })).toEqual(['Missing coordinates', 'Missing location', 'Missing named place', 'County not recorded']);
    expect(qualityIssues({ ...event, lng: 181 })).toContain('Invalid coordinates');
  });
  it('summarizes records rather than unique participants or inferred county', () => {
    expect(coverageSummary([event, market, { ...event, id: 'second', lat: null }])).toEqual([{ place: 'Campus', events: 2, markets: 1, mapped: 2 }]);
    expect(coverageSummary([])).toEqual([]);
  });
  it('fails closed on missing roles, nonadmin roles and lookup errors', () => {
    for (const role of [false, null, undefined, 'admin']) expect(() => assertInsightsAdmin(role)).toThrow('Administrator access required');
    expect(() => assertInsightsAdmin(true, new Error('lookup failed'))).toThrow();
    expect(() => assertInsightsAdmin(true)).not.toThrow();
  });
});
