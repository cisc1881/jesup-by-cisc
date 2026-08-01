import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import {
  EventCalendarView,
  EventFilters,
  EventMapView,
  EventSectionRow,
  EventsEmptyState,
  EventsPageSkeleton,
  EventsPullRefresh,
  FeaturedCiscEvents,
  FeaturedEventHero,
  type EventViewMode,
} from "@/components/events";
import { useSavedEvents } from "@/hooks/use-saved-events";
import { fetchEventCategories, fetchEvents, filterEvents, partitionEvents } from "@/lib/events";
import { listPageHead } from "@/lib/seo";
import { useInstitutionTheme } from "@/components/institution-theme-provider";

export const Route = createFileRoute("/events/")({
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
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<EventViewMode>("list");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const { savedIds, toggleSaved, savedCount } = useSavedEvents();
  const { institutionId, institutionName } = useInstitutionTheme();

  const {
    data: events,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["events"],
    queryFn: () => fetchEvents({ upcomingOnly: false }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["event-categories"],
    queryFn: fetchEventCategories,
  });

  const relevantEvents = useMemo(
    () =>
      (events ?? []).filter(
        (event) =>
          !institutionId || event.networkWide || event.institutionIds.includes(institutionId),
      ),
    [events, institutionId],
  );

  const filtered = useMemo(
    () => filterEvents(relevantEvents, search, categoryId, showSavedOnly, savedIds),
    [relevantEvents, search, categoryId, showSavedOnly, savedIds],
  );

  const sections = useMemo(() => partitionEvents(filtered), [filtered]);
  const showInitialSkeleton = isLoading && !events?.length;

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setCategoryId(null);
    setShowSavedOnly(false);
    setViewMode("list");
  }, []);

  return (
    <PublicLayout>
      <EventsPullRefresh onRefresh={handleRefresh} disabled={isFetching}>
        <PageContainer
          size="lg"
          className="space-y-8 pb-bottom-nav md:space-y-10 md:pb-[var(--page-py)]"
        >
          <header className="space-y-3">
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
          </header>

          <FeaturedCiscEvents />

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
                <div className="space-y-10 md:space-y-12">
                  {sections.featured && viewMode === "list" && !showSavedOnly && (
                    <FeaturedEventHero event={sections.featured} />
                  )}

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
                    <>
                      <EventSectionRow
                        title="Upcoming Events"
                        events={sections.upcoming}
                        sectionId="upcoming-events"
                        savedIds={savedIds}
                        onToggleSaved={toggleSaved}
                      />
                      <EventSectionRow
                        title="This Week"
                        events={sections.thisWeek}
                        sectionId="this-week-events"
                        animationOffset={2}
                        savedIds={savedIds}
                        onToggleSaved={toggleSaved}
                      />
                      <EventSectionRow
                        title="This Month"
                        events={sections.thisMonth}
                        sectionId="this-month-events"
                        animationOffset={4}
                        savedIds={savedIds}
                        onToggleSaved={toggleSaved}
                      />
                      {sections.later.length > 0 && (
                        <EventSectionRow
                          title="Later"
                          events={sections.later}
                          sectionId="later-events"
                          animationOffset={6}
                          savedIds={savedIds}
                          onToggleSaved={toggleSaved}
                        />
                      )}
                      {sections.past.length > 0 && !showSavedOnly && (
                        <EventSectionRow
                          title="Past Events"
                          events={sections.past.slice(0, 12)}
                          sectionId="past-events"
                          animationOffset={8}
                          savedIds={savedIds}
                          onToggleSaved={toggleSaved}
                        />
                      )}
                    </>
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
