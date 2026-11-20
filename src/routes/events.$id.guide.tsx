import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Navigation, Store } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import { WideDiscoveryCard } from "@/components/design-system/wide-discovery-card";
import { fetchEventById } from "@/lib/events";
import { fetchMarkets } from "@/lib/markets";

export const Route = createFileRoute("/events/$id/guide")({
  loader: async ({ params }) => ({ event: await fetchEventById(params.id) }),
  head: ({ loaderData }) => ({
    meta: [{ title: `City Guide · ${loaderData?.event?.title ?? "Event"} · JESUP` }],
  }),
  component: EventCityGuide,
});

function EventCityGuide() {
  const { id } = Route.useParams();
  const { event } = Route.useLoaderData();
  const venueCoords =
    event?.lat != null && event.lng != null ? { lat: event.lat, lng: event.lng } : null;
  const {
    data: markets = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["event-city-guide-markets", id, venueCoords?.lat, venueCoords?.lng],
    enabled: !!venueCoords,
    queryFn: () => fetchMarkets({ coords: venueCoords }),
  });
  const nearbyMarkets = markets
    .filter((market) => market.distanceKm != null && market.distanceKm <= 40)
    .slice(0, 6);
  const destination = event
    ? venueCoords
      ? `${venueCoords.lat},${venueCoords.lng}`
      : event.locationAddress || event.location
    : null;

  if (!event) {
    return (
      <PublicLayout>
        <PageContainer size="md" className="py-16 text-center">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <Link
            to="/events"
            search={{ view: "explore" }}
            className="mt-5 inline-block font-bold text-primary"
          >
            Browse events
          </Link>
        </PageContainer>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <PageContainer size="lg" className="space-y-8 pb-bottom-nav md:pb-[var(--page-py)]">
        <Link
          to="/events/$id/hub"
          params={{ id }}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Event Hub
        </Link>
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
            Event visitor guide
          </p>
          <h1 className="mt-2 text-4xl font-black">City Guide</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Plan your visit to {event.title} with the published venue details and local markets in
            JESUP.
          </p>
        </header>

        <section
          className="rounded-3xl border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-7"
          aria-labelledby="venue-heading"
        >
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MapPin className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 id="venue-heading" className="text-xl font-black">
                Your event venue
              </h2>
              <p className="mt-1 text-muted-foreground">
                {event.locationAddress ||
                  event.location ||
                  "Venue details have not been published."}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {destination && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" /> Directions
              </a>
            )}
            <Link
              to="/events/$id"
              params={{ id }}
              hash="event-map"
              className="inline-flex min-h-11 items-center rounded-xl border px-5 text-sm font-bold"
            >
              Event map and wayfinding
            </Link>
          </div>
        </section>

        <section aria-labelledby="markets-heading" className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                Explore locally
              </p>
              <h2 id="markets-heading" className="mt-1 text-2xl font-black">
                Markets near the venue
              </h2>
            </div>
            <Link to="/markets" className="text-sm font-bold text-primary hover:underline">
              All markets
            </Link>
          </div>
          {!venueCoords ? (
            <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
              The venue has no published map coordinates yet. Browse the full Markets catalog for
              local options.
            </p>
          ) : isError ? (
            <p
              role="alert"
              className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground"
            >
              Markets could not be loaded right now.
            </p>
          ) : isLoading ? (
            <p role="status" className="text-sm text-muted-foreground">
              Loading nearby markets…
            </p>
          ) : nearbyMarkets.length === 0 ? (
            <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
              No markets are currently listed within 40 km of this venue.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nearbyMarkets.map((market) => (
                <WideDiscoveryCard
                  key={market.id}
                  href={`/markets/${encodeURIComponent(market.id)}`}
                  title={market.name}
                  imageUrl={market.coverImageUrl}
                  imageAlt={market.name}
                  eyebrow={`${Math.round(market.distanceKm!)} km from venue`}
                  detail={[market.city, market.state].filter(Boolean).join(", ")}
                />
              ))}
            </div>
          )}
        </section>

        <Link
          to="/markets"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary"
        >
          <Store className="h-4 w-4" aria-hidden="true" /> Browse all farmers markets
        </Link>
      </PageContainer>
    </PublicLayout>
  );
}
