import type { EventListItem } from "@/lib/events";
import { HorizontalScroll, HorizontalScrollItem, SectionHeader } from "@/components/design-system";
import { EventCard } from "@/components/events/event-card";

type EventSectionRowProps = {
  title: string;
  events: EventListItem[];
  sectionId?: string;
  animationOffset?: number;
  savedIds?: Set<string>;
  onToggleSaved?: (eventId: string) => void;
};

export function EventSectionRow({
  title,
  events,
  sectionId,
  animationOffset = 0,
  savedIds,
  onToggleSaved,
}: EventSectionRowProps) {
  if (events.length === 0) return null;

  const headingId = sectionId ?? `events-section-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section aria-labelledby={headingId} className="space-y-5 animate-fade-up">
      <SectionHeader title={title} titleId={headingId} />
      <div className="gold-divider" />
      <HorizontalScroll gap="md">
        {events.map((event, index) => (
          <HorizontalScrollItem key={event.id} width="md">
            <EventCard
              event={event}
              animationIndex={animationOffset + index}
              className="w-[78vw] sm:w-72"
              saved={savedIds?.has(event.id)}
              onToggleSaved={onToggleSaved ? () => onToggleSaved(event.id) : undefined}
            />
          </HorizontalScrollItem>
        ))}
      </HorizontalScroll>
    </section>
  );
}
