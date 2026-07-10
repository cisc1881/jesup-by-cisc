import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader, AdminShell } from "@/components/admin-page";
import { EventGalleryTab } from "@/components/admin/event-gallery-tab";
import { LoadingState, QueryErrorState } from "@/components/design-system";
import { fetchEventGalleryHeader } from "@/lib/event-gallery";
import { fmtDateTime } from "@/lib/format";
import { ArrowLeft } from "lucide-react";

export const Route = createLazyFileRoute("/_authenticated/admin/events/$eventId/gallery")({
  component: AdminEventGalleryPage,
});

function AdminEventGalleryPage() {
  const { eventId } = Route.useParams();

  const { data: header, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-gallery-header", eventId],
    queryFn: () => fetchEventGalleryHeader(eventId),
  });

  return (
    <AdminShell>
      <AdminPageHeader
        title={header?.title ?? "Event gallery"}
        description={header ? fmtDateTime(header.startsAt) : undefined}
        actions={
          <Link
            to="/admin/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to events
          </Link>
        }
      />

      {isLoading && <LoadingState label="Loading event…" />}
      {isError && <QueryErrorState title="Couldn't load event" onRetry={() => refetch()} />}
      {!isLoading && !isError && <EventGalleryTab eventId={eventId} />}
    </AdminShell>
  );
}
