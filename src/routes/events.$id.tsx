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
  EventWorkspaceMenu,
  EventChatRoom,
} from "@/components/events";
import { useAuth } from "@/hooks/use-auth";
import { fetchUserEventRegistration, type EventDetail } from "@/lib/events";
import { getPublicEvent } from '@/lib/public-events.functions';
import { ArrowLeft } from "lucide-react";
import { AppButton } from "@/components/design-system";
import { conferenceHead } from "@/lib/conference";
import { ConferenceShell } from "@/components/events/conference-shell";
import { NextSessionCountdown } from "@/components/events/next-session-countdown";
import { EventWayfinding } from "@/components/events/event-wayfinding";
import { EventMealTickets } from "@/components/events/event-meal-tickets";

export const Route = createFileRoute("/events/$id")({
  loader: async ({ params }) => {
    const event = JSON.parse(await getPublicEvent({ data: { id: params.id } })) as EventDetail | null;
    return { event };
  },
  head: ({ loaderData }) => conferenceHead(loaderData?.event ?? null),
  component: EventDetailPage,
});

function EventDetailPage() {
  const matches = useMatches();
  const isChild = matches.some(
    (m) =>
      m.routeId === "/events/$id/evaluation" ||
      m.routeId === "/events/$id/hub" ||
      m.routeId === "/events/$id/guide",
  );
  const { user } = useAuth();
  const { event } = Route.useLoaderData();

  const { data: registration } = useQuery({
    queryKey: ["event-reg", event?.id, user?.id],
    enabled: !!user && !!event && event.metadata.conference_shell !== true && !isChild,
    queryFn: () => user && event ? fetchUserEventRegistration(event.id, user.id) : Promise.resolve(null),
  });

  if (isChild) return <Outlet />;

  if (event?.metadata.conference_shell === true) return <ConferenceShell event={event} />;

  if (!event) {
    return (
      <PublicLayout>
        <PageContainer size="md" className="py-16 text-center">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <AppButton variant="outline" className="mt-6" asChild>
            <Link to="/events" search={{ view: "explore" }}>
              Back to events
            </Link>
          </AppButton>
        </PageContainer>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <PageContainer
        size="lg"
        className="space-y-10 pb-bottom-nav md:space-y-12 md:pb-[var(--page-py)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AppButton variant="ghost" size="sm" shape="pill" className="w-fit" asChild>
            <Link to="/events" search={{ view: "explore" }}>
              <ArrowLeft className="h-4 w-4" />
              All events
            </Link>
          </AppButton>
          <EventWorkspaceMenu
            event={event}
            registration={registration}
            userId={user?.id}
            userEmail={user?.email}
          />
        </div>

        <EventDetailHero event={event} />
        <NextSessionCountdown event={event} />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="space-y-10">
            <EventDescription event={event} />
            <div id="event-agenda" className="scroll-mt-24">
              <EventAgenda event={event} />
            </div>
            <div id="event-speakers" className="scroll-mt-24">
              <EventSpeakers event={event} />
            </div>
            <EventGallery event={event} />
            {user && (
              <div className="flex justify-start">
                <EventPhotoSubmitButton
                  eventId={event.id}
                  eventTitle={event.title}
                  userId={user.id}
                />
              </div>
            )}
            <EventMealTickets eventId={event.id} registrationId={registration?.id} />
            <EventChatRoom eventId={event.id} registered={!!registration} />
            <div id="event-map" className="scroll-mt-24 space-y-8">
              {(event.lat != null || event.location) && <EventMapView events={[event]} />}
              <EventWayfinding eventId={event.id} />
            </div>
            <div id="event-resources" className="scroll-mt-24">
              <EventRelatedSections event={event} />
            </div>
            <EvaluationCta event={event} />
          </div>

          <div id="event-registration" className="scroll-mt-24 lg:sticky lg:top-24">
            <EventRegistrationPanel event={event} registration={registration} />
          </div>
        </div>
      </PageContainer>
    </PublicLayout>
  );
}
