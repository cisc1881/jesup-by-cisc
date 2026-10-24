import { createFileRoute, ClientOnly, Link, useRouter } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { lazy, Suspense, useState } from 'react';
import { MapPin, CalendarDays, Store, RefreshCw, ListChecks, Map as MapIcon } from 'lucide-react';
import { CommandCenterContentShell, CommandCenterPageHeader } from '@/modules/admin';
import { AppButton } from '@/components/design-system';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getExtensionInsights } from '@/lib/extension-insights.functions';
import { coverageSummary, insightsFiltersSchema, qualityIssues, validCoordinates, type InsightsFilters } from '@/lib/extension-insights';

const CoverageMap = lazy(() => import('@/components/admin/extension-coverage-map'));
const options = (filters: InsightsFilters) => queryOptions({
  queryKey: ['extension-insights', filters.from, filters.to, filters.type, filters.institution],
  queryFn: () => getExtensionInsights({ data: filters }), staleTime: 60_000,
});
export const Route = createFileRoute('/_authenticated/admin/insights')({
  validateSearch: (search) => {
    const result = insightsFiltersSchema.safeParse(search);
    return result.success ? result.data : insightsFiltersSchema.parse({});
  },
  loaderDeps: ({ search }) => ({ from: search.from, to: search.to, type: search.type, institution: search.institution }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(options({ ...deps, view: 'coverage' })),
  head: () => ({ meta: [
    { title: 'Extension Insights · JESUP Command Center' },
    { name: 'description', content: 'Administrator venue coverage, operational activity and data quality from recorded JESUP events and markets.' },
    { property: 'og:title', content: 'Extension Insights · JESUP' },
    { property: 'og:description', content: 'Recorded venue coverage and source-labelled operational metrics for JESUP administrators.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex, nofollow' },
  ] }),
  component: ExtensionInsights,
  pendingComponent: () => <p className="p-6 text-muted-foreground" role="status">Loading Extension Insights…</p>,
  errorComponent: ({ error }) => <InsightsError error={error} />,
  notFoundComponent: () => <p className="p-6">Extension Insights is unavailable.</p>,
});
function InsightsError({ error }: { error: Error }) {
  const router = useRouter();
  return <div className="space-y-4 p-6"><p role="alert">{error.message || 'Insights could not be loaded.'}</p><AppButton variant="outline" onClick={() => router.invalidate()}>Retry</AppButton></div>;
}
function ExtensionInsights() {
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data, refetch, isFetching } = useSuspenseQuery(options(filters));
  const [dateError, setDateError] = useState('');
  const update = (change: Partial<InsightsFilters>) => {
    const result = insightsFiltersSchema.safeParse({ ...filters, ...change });
    if (!result.success) { setDateError(result.error.issues[0]?.message ?? 'Invalid filter.'); return; }
    setDateError('');
    void navigate({ search: result.data });
  };
  const mapped = data.places.filter(place => validCoordinates(place.lat, place.lng));
  const events = data.places.filter(place => place.kind === 'event');
  const markets = data.places.filter(place => place.kind === 'market');
  const groups = coverageSummary(data.places);
  const tableCell = 'px-3 py-3 text-left align-top';
  const stats = [
    { label: 'Published active events', value: events.length, source: 'Events', meaning: 'Event records in the selected date and institution scope.', icon: CalendarDays },
    { label: 'Active markets', value: markets.length, source: 'Markets', meaning: 'Current active listings, not market visits or dated activity.', icon: Store },
    { label: 'Mapped venue records', value: mapped.length, source: 'Events / Markets coordinates', meaning: 'Valid latitude/longitude pairs; co-located records remain separate.', icon: MapPin },
    { label: 'Registration records', value: data.metrics.registrations, source: 'Event registrations', meaning: 'All registration records for selected events, including cancellations; not unique people.', icon: CalendarDays },
    { label: 'Cancelled registrations', value: data.metrics.cancelled, source: 'Event registrations · status', meaning: 'Records explicitly marked cancelled for selected events.', icon: ListChecks },
    { label: 'Recorded registration check-ins', value: data.metrics.checkedIn, source: 'Event registrations · check-in timestamp', meaning: 'Non-cancelled registrations with a check-in timestamp. Excludes walk-ins and manual/virtual attendance without this timestamp.', icon: ListChecks },
  ];
  return <CommandCenterContentShell>
    <CommandCenterPageHeader title="Extension Insights" description="Venue coverage · recorded activity · data quality" actions={
      <AppButton variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}><RefreshCw className={isFetching ? 'animate-spin' : ''} />Refresh</AppButton>
    } />
    <div className="mb-6 grid gap-4 border-y border-border py-5 sm:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-2"><Label htmlFor="insights-from">Event date from (UTC)</Label><Input id="insights-from" type="date" value={filters.from ?? ''} onChange={e => update({ from: e.target.value || undefined })} /></div>
      <div className="space-y-2"><Label htmlFor="insights-to">Event date through (UTC)</Label><Input id="insights-to" type="date" value={filters.to ?? ''} onChange={e => update({ to: e.target.value || undefined })} /></div>
      <div className="space-y-2"><Label htmlFor="insights-type">Record type</Label><Select value={filters.type} onValueChange={type => update({ type: type as InsightsFilters['type'] })}><SelectTrigger id="insights-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Events and markets</SelectItem><SelectItem value="event">Events</SelectItem><SelectItem value="market">Markets</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="insights-institution">Recorded event institution</Label><Select value={filters.institution} onValueChange={institution => update({ institution })}><SelectTrigger id="insights-institution"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All / unassigned</SelectItem><SelectItem value="unassigned">No recorded association</SelectItem>{data.institutions.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent></Select></div>
      {dateError && <p role="alert" className="text-sm text-destructive sm:col-span-2 xl:col-span-4">{dateError}</p>}
      <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2 xl:col-span-4">Dates select overlapping event intervals, with an inclusive final UTC day. Markets remain current listings and have no institution association. Venue locations are not participant home geography.</p>
    </div>
    <section aria-labelledby="activity-heading" className="mb-8">
      <h2 id="activity-heading" className="mb-3 text-lg font-semibold">Operational activity</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{stats.map(stat => <div key={stat.label} className="rounded-lg border border-border bg-card p-4 text-card-foreground">
        <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold">{stat.label}</h3><stat.icon className="h-4 w-4 shrink-0 text-primary" /></div>
        <p className="my-2 text-3xl font-bold tabular-nums">{stat.value.toLocaleString()}</p>
        <p className="text-xs font-semibold text-primary">Source: {stat.source}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stat.meaning}</p>
      </div>)}</div>
    </section>
    <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Insights view">
      <AppButton variant={filters.view === 'coverage' ? 'secondary' : 'ghost'} aria-pressed={filters.view === 'coverage'} onClick={() => update({ view: 'coverage' })}><MapIcon />Coverage</AppButton>
      <AppButton variant={filters.view === 'quality' ? 'secondary' : 'ghost'} aria-pressed={filters.view === 'quality'} onClick={() => update({ view: 'quality' })}><ListChecks />Data quality</AppButton>
      <AppButton variant="ghost" onClick={() => { setDateError(''); void navigate({ search: insightsFiltersSchema.parse({ view: filters.view }) }); }}>Reset filters</AppButton>
    </div>
    {filters.view === 'coverage' ? <section aria-labelledby="coverage-heading" className="space-y-4">
      <div><h2 id="coverage-heading" className="text-lg font-semibold">Recorded venue coverage</h2><p className="mt-1 text-sm text-muted-foreground">Events: larger markers · Markets: smaller markers. No attendee identities or street addresses are shown.</p></div>
      {mapped.length ? <ClientOnly fallback={<MapLoading />}><Suspense fallback={<MapLoading />}><CoverageMap places={mapped} /></Suspense></ClientOnly> : <Empty title="No mappable venues" text="No selected record has valid coordinates. Review data quality or change the filters." />}
      <h3 className="pt-3 font-semibold">County / place summary</h3>
      <p className="text-sm text-muted-foreground">County is not recorded in the event/market models. Named places below are recorded event venues or market city/state, not verified county coverage.</p>
      {groups.length ? <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm"><caption className="sr-only">Selected records grouped by recorded place</caption><thead className="bg-muted"><tr>{['Recorded place', 'County', 'Events', 'Markets', 'Mapped'].map(h => <th key={h} scope="col" className={tableCell}>{h}</th>)}</tr></thead><tbody>{groups.map(group => <tr key={group.place} className="border-t border-border"><th scope="row" className={tableCell}>{group.place}</th><td className={tableCell}>Not recorded</td><td className={tableCell}>{group.events}</td><td className={tableCell}>{group.markets}</td><td className={tableCell}>{group.mapped}</td></tr>)}</tbody></table></div> : <Empty title="No records match" text="Change the type, event dates or institution filter." />}
      {data.places.length > 0 && <div className="divide-y divide-border border-y border-border">{data.places.map(place => <div key={`${place.kind}-${place.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="font-medium">{place.name}</p><p className="text-xs text-muted-foreground">{place.kind === 'event' ? 'Event' : 'Market'} · {place.place ?? 'Place not recorded'} · {validCoordinates(place.lat, place.lng) ? 'Mapped' : 'Not mapped'}</p></div></div>)}</div>}
    </section> : <section aria-labelledby="quality-heading" className="space-y-4">
      <h2 id="quality-heading" className="text-lg font-semibold">Data quality · selected records</h2>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm"><p>Coordinate gaps: <strong>{data.places.filter(p => !validCoordinates(p.lat, p.lng)).length}</strong></p><p>Missing location: <strong>{data.places.filter(p => !p.hasLocation).length}</strong></p><p>Missing named place: <strong>{data.places.filter(p => !p.place).length}</strong></p><p>County not recorded: <strong>{data.places.length}</strong></p></div>
      <p className="text-sm text-muted-foreground">County gaps are a model limitation, not an inferred county. Coordinate validation checks numeric ranges, not on-the-ground accuracy. Existing editors remain the source of record.</p>
      {data.places.length ? <ul className="divide-y divide-border border-y border-border">{data.places.map(place => <li key={`${place.kind}-${place.id}`} className="flex flex-wrap items-start justify-between gap-3 py-4"><div className="min-w-0 flex-1"><h3 className="font-semibold">{place.name}</h3><p className="text-xs text-muted-foreground">{place.kind === 'event' ? 'Event' : 'Market'} · {place.place ?? 'Place not recorded'}</p><div className="mt-2 flex flex-wrap gap-2">{qualityIssues(place).map(issue => <span key={issue} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{issue}</span>)}</div></div><AppButton variant="outline" size="sm" asChild>{place.kind === 'event' ? <Link to="/admin/events">Manage events</Link> : <Link to="/admin/markets">Manage markets</Link>}</AppButton></li>)}</ul> : <Empty title="No records to review" text="Change the filters to include active published events or active markets." />}
    </section>}
    <section aria-labelledby="outcomes-heading" className="mt-8 border-t border-border py-5"><h2 id="outcomes-heading" className="font-semibold">Outcomes / impact · not measured here</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Activity counts do not establish participant reach, learning, behavior change or community impact. This dashboard does not aggregate outcome records or infer home geography from venues. No impact estimate is reported.</p><p className="mt-3 text-xs text-muted-foreground">Last read: {new Date(data.updatedAt).toLocaleString('en-US', { timeZone: 'UTC' })} UTC · Metrics follow selected events, including those without coordinates.</p></section>
  </CommandCenterContentShell>;
}
function Empty({ title, text }: { title: string; text: string }) {
  return <div className="border-y border-border py-12 text-center"><MapPin className="mx-auto mb-3 h-6 w-6 text-primary" /><h3 className="font-semibold">{title}</h3><p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{text}</p></div>;
}
function MapLoading() { return <div className="flex h-[420px] items-center justify-center rounded-lg bg-muted text-muted-foreground sm:h-[480px]" role="status">Loading venue map…</div>; }