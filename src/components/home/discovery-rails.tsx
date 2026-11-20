import { Link } from "@tanstack/react-router";
import { WideDiscoveryCard } from "@/components/design-system/wide-discovery-card";
import type { HomeEvent } from "@/lib/home";
import { fmtDateTime } from "@/lib/format";

export function DiscoveryRails({ events }: { events: HomeEvent[] }) {
  const now = Date.now();
  const upcoming = [...events]
    .filter((event) => Date.parse(event.startsAt) >= now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const weekEnd = now + 7 * 24 * 60 * 60 * 1000;
  const rails = [
    { title: "Upcoming Events", events: upcoming.slice(0, 6) },
    {
      title: "This Week",
      events: upcoming.filter((event) => Date.parse(event.startsAt) <= weekEnd).slice(0, 6),
    },
  ].filter((rail) => rail.events.length > 0);

  return (
    <div className="space-y-10">
      {rails.map((rail) => (
        <section key={rail.title} aria-label={rail.title} className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-black tracking-tight">{rail.title}</h2>
            <Link
              to="/events"
              search={{ view: "explore" }}
              className="text-sm font-bold text-primary hover:underline"
            >
              See all events
            </Link>
          </div>
          <div className="-mx-[var(--page-px)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--page-px)] pb-3 sm:mx-0 sm:px-0">
            {rail.events.map((event) => (
              <WideDiscoveryCard
                key={event.id}
                href={`/events/${encodeURIComponent(event.id)}`}
                title={event.title}
                imageUrl={event.imageUrl}
                imageAlt={event.title}
                eyebrow={fmtDateTime(event.startsAt)}
                detail={event.location}
                className="w-[84vw] max-w-[440px] shrink-0 snap-start sm:w-[44vw]"
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
