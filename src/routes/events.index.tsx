import { createFileRoute, type SearchSchemaInput } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import {
  EventCalendarView,
  EventFilters,
  EventMapView,
  EventsEmptyState,
  EventsPageSkeleton,
  EventsPullRefresh,
  type EventViewMode,
} from "@/components/events";
import { DirectoryResultList } from "@/components/directory-result-list";
import { useSavedEvents } from "@/hooks/use-saved-events";
import { fetchEventCategories, fetchEvents, filterEvents, type EventListItem } from "@/lib/events";
import { fmtDateTime } from "@/lib/format";
import { listPageHead } from "@/lib/seo";
import { useInstitutionTheme } from "@/components/institution-theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  InstitutionScopeFilter,
  matchesInstitutionScope,
  type InstitutionScope,
} from "@/components/institution-scope-filter";

export const Route = createFileRoute("/events/")({
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => ({
    view: search.view === "mine" ? ("mine" as const) : ("explore" as const),
  }),
  head: () =>
    listPageHead({
      title: "Events",
      description:
        "Workshops, conferences, trainings, and community events from CISC at Tuskegee University.",
      path: "/events",
    }),
  component: EventsPage,
});

function EventsPage() {
  const { view } = Route.useSearch();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [discoveryMode, setDiscoveryMode] = useState<"mine" | "explore">(view);
  const [format, setFormat] = useState<"all" | "conference" | "workshop" | "meeting" | "seminar">(
    "all",
  );
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<EventViewMode>("list");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const { savedIds, savedCount } = useSavedEvents();
  const { institutionId, institutionName } = useInstitutionTheme();
  const [institutionScope, setInstitutionScope] = useState<InstitutionScope>(
    institutionId ? "mine" : "all",
  );

  const {
    data: events,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<EventListItem[]>({
    queryKey: ["events"],
    queryFn: () => fetchEvents({ upcomingOnly: false }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["event-categories"],
    queryFn: fetchEventCategories,
  });

  const { data: registeredEventIds = [] } = useQuery({
    queryKey: ["event-directory-registrations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("user_id", user!.id)
        .neq("status", "cancelled");
      if (error) throw error;
      return (data ?? []).map((row) => row.event_id);
    },
  });

  const relevantEvents = useMemo(
    () =>
      (events ?? []).filter((event) =>
        matchesInstitutionScope(event, institutionScope, institutionId),
      ),
    [events, institutionId, institutionScope],
  );

  const filtered = useMemo(() => {
    const base = filterEvents(relevantEvents, search, categoryId, showSavedOnly, savedIds);
    return base.filter((event) => {
      if (discoveryMode === "mine" && !registeredEventIds.includes(event.id)) return false;
      if (format === "all") return true;
      const content =
        `${event.categoryName ?? ""} ${event.categorySlug ?? ""} ${event.title}`.toLowerCase();
      if (format === "workshop") return /workshop|training|field day|demonstration/.test(content);
      return content.includes(format);
    });
  }, [
    categoryId,
    discoveryMode,
    format,
    registeredEventIds,
    relevantEvents,
    savedIds,
    search,
    showSavedOnly,
  ]);

  const showInitialSkeleton = isLoading && !(events ?? []).length;

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setCategoryId(null);
    setShowSavedOnly(false);
    setFormat("all");
    setViewMode("list");
  }, []);

  return (
    <PublicLayout>
      <EventsPullRefresh onRefresh={handleRefresh} disabled={isFetching}>
        <PageContainer
          size="lg"
          className="space-y-8 pb-bottom-nav md:space-y-10 md:pb-[var(--page-py)]"
        >
          <header className="-mx-[var(--page-px)] border-b bg-card sm:mx-0 sm:border">
            <div className="institution-primary-surface px-[var(--page-px)] py-7 sm:px-6">
              <p className="text-eyebrow institution-accent-text">
                {institutionName ?? "1890 Land-Grant Network"}
              </p>
              <h1 className="text-4xl font-black tracking-[var(--tracking-tight)] text-foreground sm:text-5xl">
                Events
              </h1>
              {relevantEvents.length > 0 && (
                <p className="max-w-2xl text-base text-muted-foreground">
                  {filtered.length} relevant event{filtered.length === 1 ? "" : "s"} from your
                  institution and the shared 1890 network.
                </p>
              )}
            </div>
            <div
              className="grid grid-cols-2 border-t border-border"
              role="tablist"
              aria-label="Event discovery"
            >
              {(["mine", "explore"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={discoveryMode === mode}
                  onClick={() => setDiscoveryMode(mode)}
                  className={cn(
                    "min-h-14 border-b-4 px-4 text-sm font-black",
                    discoveryMode === mode
                      ? "border-[var(--institution-accent)] institution-accent-text"
                      : "border-transparent text-muted-foreground",
                  )}
                >
                  {mode === "mine" ? "My Events" : "Explore Events"}
                </button>
              ))}
            </div>
          </header>

          <InstitutionScopeFilter
            value={institutionScope}
            onChange={setInstitutionScope}
            hasInstitution={!!institutionId}
          />

          <div
            className="-mx-[var(--page-px)] flex overflow-x-auto border-y bg-card sm:mx-0"
            aria-label="Event type"
          >
            {(["all", "conference", "workshop", "meeting", "seminar"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFormat(item)}
                aria-pressed={format === item}
                className={cn(
                  "min-h-12 shrink-0 border-r px-5 text-sm font-bold capitalize",
                  format === item ? "institution-accent-bg" : "bg-card text-muted-foreground",
                )}
              >
                {item === "all" ? "All" : `${item}s`}
              </button>
            ))}
          </div>

          {showInitialSkeleton ? (
            <EventsPageSkeleton />
          ) : !relevantEvents.length ? (
            <EventsEmptyState variant="empty" />
          ) : (
            <>
              {filtered.length === 0 ? (
                <>
                  <EventFilters
                    categories={categories}
                    selectedCategoryId={categoryId}
                    onCategoryChange={setCategoryId}
                    search={search}
                    onSearchChange={setSearch}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    showSavedOnly={showSavedOnly}
                    onShowSavedOnlyChange={setShowSavedOnly}
                    savedCount={savedCount}
                  />
                  <EventsEmptyState
                    variant={showSavedOnly ? "saved" : "no-results"}
                    onClearFilters={showSavedOnly ? undefined : clearFilters}
                  />
                </>
              ) : (
                <div className="space-y-6">
                  <EventFilters
                    categories={categories}
                    selectedCategoryId={categoryId}
                    onCategoryChange={setCategoryId}
                    search={search}
                    onSearchChange={setSearch}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    showSavedOnly={showSavedOnly}
                    onShowSavedOnlyChange={setShowSavedOnly}
                    savedCount={savedCount}
                  />

                  {viewMode === "calendar" && <EventCalendarView events={filtered} />}
                  {viewMode === "map" && <EventMapView events={filtered} />}

                  {viewMode === "list" && (
                    <DirectoryResultList
                      title={discoveryMode === "mine" ? "My events" : "Upcoming events"}
                      className="-mx-[var(--page-px)] sm:mx-0"
                      results={filtered.map((event) => ({
                        id: event.id,
                        title: event.title,
                        subtitle: fmtDateTime(event.startsAt),
                        detail: event.location,
                        imageUrl: event.coverImageUrl,
                        to: "/events/$id" as const,
                        params: { id: event.id },
                      }))}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </PageContainer>
      </EventsPullRefresh>
    </PublicLayout>
  );
}
