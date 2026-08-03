import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((e, index) => (
            <Link
              key={e.id}
              to="/events/$id"
              params={{ id: e.id }}
              className={`group block rounded-2xl border p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--institution-accent)] hover:shadow-[var(--shadow-lift)] ${
                index % 2 === 0 ? "institution-surface-primary" : "institution-surface-secondary"
              }`}
            >
              <div className="flex h-full flex-col">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] grad-gold-text">
                  {fmtDateTime(e.startsAt)}
                </div>
                <h3 className="mt-3 line-clamp-3 text-lg font-extrabold text-foreground">
                  {e.title}
                </h3>
                {e.location && (
                  <p className="mt-3 flex items-center gap-2 truncate text-sm text-muted-foreground">
                    <MapPin
                      className="h-4 w-4 shrink-0 institution-accent-text"
                      aria-hidden="true"
                    />
                    {e.location}
                  </p>
                )}
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold institution-accent-text">
                  {e.registrationOpen ? "Register" : "Learn more"}
                  <ArrowRight
                    className="size-4 transition group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </HomeSection>
  );
}
