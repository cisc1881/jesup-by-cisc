import { Link } from "@tanstack/react-router";
import { ChevronRight, Calendar } from "lucide-react";
import type { HomeEvent, HomeSectionMeta } from "@/lib/home";
import { fmtDateTime } from "@/lib/format";
import { EmptyState, HomeSection, SectionActionLink } from "@/components/design-system";
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
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
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
        <div className="divide-y border-y">
          {events.slice(0, 5).map((e) => {
            const date = new Date(e.startsAt);
            return (
              <Link
                key={e.id}
                to="/events/$id"
                params={{ id: e.id }}
                className="group grid min-h-28 grid-cols-[64px_minmax(0,1fr)_24px] items-center gap-4 py-4 hover:bg-muted/50"
              >
                <time dateTime={e.startsAt} className="text-center font-black leading-none">
                  <span className="block text-xs uppercase tracking-wider institution-accent-text">
                    {date.toLocaleDateString(undefined, { month: "short" })}
                  </span>
                  <span className="mt-1 block text-3xl">{date.getDate()}</span>
                </time>
                <span className="min-w-0">
                  <h3 className="line-clamp-2 text-base font-extrabold text-foreground sm:text-lg">
                    {e.title}
                  </h3>
                  <span className="mt-2 block truncate text-sm text-muted-foreground">
                    {e.location ?? fmtDateTime(e.startsAt)}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 text-foreground" />
              </Link>
            );
          })}
        </div>
      )}
    </HomeSection>
  );
}
