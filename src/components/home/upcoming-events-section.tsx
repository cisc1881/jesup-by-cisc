import { Link } from "@tanstack/react-router";
import { Calendar, MapPin } from "lucide-react";
import type { HomeEvent, HomeSectionMeta } from "@/lib/home";
import { fmtDateTime } from "@/lib/format";
import {
  EmptyState,
  HomeSection,
  HorizontalScroll,
  HorizontalScrollItem,
  MediaCard,
  SectionActionLink,
} from "@/components/design-system";
import { Skeleton } from "@/components/ui/skeleton";

type UpcomingEventsSectionProps = {
  events: HomeEvent[];
  meta: HomeSectionMeta;
  isLoading?: boolean;
};

export function UpcomingEventsSection({ events, meta, isLoading }: UpcomingEventsSectionProps) {
  return (
    <HomeSection sectionId={meta.id} meta={meta}>
      {isLoading ? (
        <HorizontalScroll>
          {Array.from({ length: 3 }).map((_, i) => (
            <HorizontalScrollItem key={i}>
              <Skeleton className="h-56 w-[75vw] rounded-2xl sm:w-64" />
            </HorizontalScrollItem>
          ))}
        </HorizontalScroll>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={meta.emptyTitle ?? meta.title}
          description={meta.emptyDescription ?? undefined}
          action={
            meta.viewAllRoute && meta.viewAllLabel ? (
              <SectionActionLink to={meta.viewAllRoute}>{meta.viewAllLabel}</SectionActionLink>
            ) : undefined
          }
        />
      ) : (
        <HorizontalScroll>
          {events.map((e) => (
            <HorizontalScrollItem key={e.id}>
              <Link to="/events/$id" params={{ id: e.id }} className="block">
                <MediaCard imageUrl={e.imageUrl} imageAlt={e.title}>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] grad-gold-text">
                    {fmtDateTime(e.startsAt)}
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-[15px] font-bold text-foreground">{e.title}</h3>
                  {e.location && (
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {e.location}
                    </p>
                  )}
                </MediaCard>
              </Link>
            </HorizontalScrollItem>
          ))}
        </HorizontalScroll>
      )}
    </HomeSection>
  );
}
