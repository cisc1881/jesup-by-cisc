import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronRight, MapPin, Search } from "lucide-react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { PageContainer, EmptyState, LoadingState } from "@/components/design-system";
import { Input } from "@/components/ui/input";
import { fetchEvents } from "@/lib/events";
import { fmtDateTime } from "@/lib/format";
import { listPageHead } from "@/lib/seo";
import { useInstitutionTheme } from "@/components/institution-theme-provider";
import {
  InstitutionScopeFilter,
  matchesInstitutionScope,
  type InstitutionScope,
} from "@/components/institution-scope-filter";

export const Route = createFileRoute("/workshops")({
  head: () =>
    listPageHead({
      title: "Workshops",
      description:
        "Search workshops, trainings, demonstrations, and learning sessions across the 1890 network.",
      path: "/workshops",
    }),
  component: WorkshopsPage,
});

function WorkshopsPage() {
  const [search, setSearch] = useState("");
  const { institutionId, institutionName } = useInstitutionTheme();
  const [scope, setScope] = useState<InstitutionScope>(institutionId ? "mine" : "all");
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["workshops"],
    queryFn: () => fetchEvents({ upcomingOnly: false }),
  });

  const workshops = useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      const type =
        `${event.categoryName ?? ""} ${event.categorySlug ?? ""} ${event.title}`.toLowerCase();
      const isWorkshop = /workshop|training|demonstration|field day|seminar|session/.test(type);
      const matchesSearch =
        !query ||
        `${event.title} ${event.location ?? ""} ${event.description ?? ""}`
          .toLowerCase()
          .includes(query);
      return isWorkshop && matchesSearch && matchesInstitutionScope(event, scope, institutionId);
    });
  }, [events, institutionId, scope, search]);

  return (
    <PublicLayout>
      <PageHeader
        eyebrow={institutionName ?? "1890 Land-Grant Network"}
        title="Workshops"
        description="Trainings, demonstrations, field days, and professional learning in one searchable directory."
      />
      <PageContainer size="lg" className="space-y-6 pb-bottom-nav">
        <InstitutionScopeFilter
          value={scope}
          onChange={setScope}
          hasInstitution={!!institutionId}
        />
        <label className="relative block">
          <span className="sr-only">Search workshops</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="workshop-search"
            name="workshop_search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search workshop, topic, or location"
            className="h-14 rounded-2xl pl-12 text-base"
          />
        </label>

        {isLoading ? (
          <LoadingState label="Loading workshops" />
        ) : workshops.length === 0 ? (
          <EmptyState
            title="No workshops found"
            description="Try another institution scope or search term."
          />
        ) : (
          <section
            aria-labelledby="workshop-results"
            className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[var(--shadow-soft)]"
          >
            <div className="border-b border-border/70 px-5 py-4">
              <h2 id="workshop-results" className="font-bold text-foreground">
                Upcoming workshops ({workshops.length})
              </h2>
            </div>
            <div className="divide-y divide-border/70">
              {workshops.map((workshop) => (
                <Link
                  key={workshop.id}
                  to="/events/$id"
                  params={{ id: workshop.id }}
                  className="group flex items-center gap-4 p-4 transition hover:bg-muted/50 sm:p-5"
                >
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl institution-accent-bg">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold leading-tight text-foreground group-hover:text-primary">
                      {workshop.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {fmtDateTime(workshop.startsAt)}
                    </p>
                    {workshop.location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {workshop.location}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </PageContainer>
    </PublicLayout>
  );
}
