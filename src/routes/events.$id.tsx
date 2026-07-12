import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import { EvaluationCta } from "@/components/evaluations/evaluation-cta";
import { EventPhotoSubmitButton } from "@/components/events/event-photo-submit-dialog";
import {
  EventAgenda,
  EventDescription,
  EventDetailHero,
  EventGallery,
  EventMapView,
  EventRegistrationPanel,
  EventRelatedSections,
  EventSpeakers,
} from "@/components/events";
import { useAuth } from "@/hooks/use-auth";
import { fetchEventById, fetchUserEventRegistration } from "@/lib/events";
import { ArrowLeft } from "lucide-react";
import { AppButton } from "@/components/design-system";

export const Route = createFileRoute("/events/$id")({
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.event ? `${loaderData.event.title} · Events · JESUP` : "Event · JESUP" },
      { name: "description", content: loaderData?.event?.description ?? "CISC event details" },
    ],
  }),
  loader: async ({ params }) => {
    const event = await fetchEventById(params.id);
    return { event };
  },
  component: EventDetailPage,
});

function EventDetailPage() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId === "/events/$id/evaluation");
  if (isChild) return <Outlet />;

  const { id } = Route.useParams();
  const { user } = useAuth();
  const { event } = Route.useLoaderData();

  const { data: registration } = useQuery({
    queryKey: ["event-reg", id, user?.id],
    enabled: !!user && !!event,
    queryFn: () => fetchUserEventRegistration(id, user!.id),
  });

  if (!event) {
    return (
      <PublicLayout>
        <PageContainer size="md" className="py-16 text-center">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <AppButton variant="outline" className="mt-6" asChild>
            <Link to="/events">Back to events</Link>
          </AppButton>
        </PageContainer>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <PageContainer size="lg" className="space-y-10 pb-bottom-nav md:space-y-12 md:pb-[var(--page-py)]">
        <AppButton variant="ghost" size="sm" shape="pill" className="w-fit" asChild>
          <Link to="/events">
            <ArrowLeft className="h-4 w-4" />
            All events
          </Link>
        </AppButton>

        <EventDetailHero event={event} />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="space-y-10">
            <EventDescription event={event} />
            <EventAgenda event={event} />
            <EventSpeakers event={event} />
            <EventGallery event={event} />
            {user && (
              <div className="flex justify-start">
                <EventPhotoSubmitButton eventId={event.id} eventTitle={event.title} userId={user.id} />
              </div>
            )}
            {(event.lat != null || event.location) && <EventMapView events={[event]} />}
            <EventRelatedSections event={event} />
            <EvaluationCta event={event} />
          </div>

          <div className="lg:sticky lg:top-24">
            <EventRegistrationPanel event={event} registration={registration} />
          </div>
        </div>
      </PageContainer>
    </PublicLayout>
  );
}
