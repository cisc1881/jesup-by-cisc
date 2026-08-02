import { createFileRoute } from "@tanstack/react-router";
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
import { fetchEventCategories, fetchEvents, filterEvents } from "@/lib/events";
import type { EventListItem } from "@/lib/events";
import { fmtDateTime } from "@/lib/format";
import { listPageHead } from "@/lib/seo";
import { useInstitutionTheme } from "@/components/institution-theme-provider";
import {
  InstitutionScopeFilter,
  matchesInstitutionScope,
  type InstitutionScope,
} from "@/components/institution-scope-filter";

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

  const relevantEvents = useMemo(
    () =>
      (events ?? []).filter((event) =>
        matchesInstitutionScope(event, institutionScope, institutionId),
      ),
    [events, institutionId, institutionScope],
  );

  const filtered = useMemo(
    () => filterEvents(relevantEvents, search, categoryId, showSavedOnly, savedIds),
    [relevantEvents, search, categoryId, showSavedOnly, savedIds],
  );

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

          <InstitutionScopeFilter
            value={institutionScope}
            onChange={setInstitutionScope}
            hasInstitution={!!institutionId}
          />

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
                      title="Events"
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
