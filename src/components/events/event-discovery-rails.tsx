import { WideDiscoveryCard } from "@/components/design-system/wide-discovery-card";
import type { EventListItem } from "@/lib/events";
import { fmtDateTime } from "@/lib/format";
import { eventCoverImageAlt } from "@/lib/event-cover-image";

export function EventDiscoveryRails({ events }: { events: EventListItem[] }) {
  const now = Date.now();
  const upcoming = events
    .filter((event) => Date.parse(event.startsAt) >= now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const categories = [
    ...new Set(upcoming.map((event) => event.categoryName).filter(Boolean)),
  ].slice(0, 3);
  const rails = [
    {
      title: "Last Minute",
      items: upcoming.filter(
        (event) =>
          event.registrationOpen &&
          event.registrationStatus === "open" &&
          Date.parse(event.startsAt) <= now + 48 * 60 * 60 * 1000,
      ),
    },
    {
      title: "This Week",
      items: upcoming.filter(
        (event) => Date.parse(event.startsAt) <= now + 7 * 24 * 60 * 60 * 1000,
      ),
    },
    ...categories.map((category) => ({
      title: category!,
      items: upcoming.filter((event) => event.categoryName === category),
    })),
  ].filter((rail) => rail.items.length > 0);

  return (
    <div className="space-y-8">
      {rails.map((rail) => (
        <section key={rail.title} aria-label={rail.title} className="space-y-4">
          <h2 className="text-2xl font-black tracking-tight">{rail.title}</h2>
          <div className="-mx-[var(--page-px)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--page-px)] pb-3 sm:mx-0 sm:px-0">
            {rail.items.slice(0, 6).map((event) => (
              <WideDiscoveryCard
                key={event.id}
                href={`/events/${encodeURIComponent(event.id)}`}
                title={event.title}
                imageUrl={event.coverImageUrl}
                imageAlt={eventCoverImageAlt(event.coverImageUrl, event.title)}
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
