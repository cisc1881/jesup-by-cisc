import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { PageContainer, EmptyState, LoadingState } from "@/components/design-system";
import { Input } from "@/components/ui/input";
import { DirectoryResultList } from "@/components/directory-result-list";
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
            className="h-14 rounded-none border-x-0 pl-12 text-base shadow-none"
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
          <DirectoryResultList
            title="Upcoming workshops"
            className="-mx-[var(--page-px)] sm:mx-0"
            results={workshops.map((workshop) => ({
              id: workshop.id,
              title: workshop.title,
              subtitle: fmtDateTime(workshop.startsAt),
              detail: workshop.location,
              imageUrl: workshop.coverImageUrl,
              to: "/events/$id" as const,
              params: { id: workshop.id },
            }))}
          />
        )}
      </PageContainer>
    </PublicLayout>
  );
}
