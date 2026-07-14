import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, MapPin, Sparkles } from "lucide-react";
import type { EventListItem } from "@/lib/events";
import { registrationStatusLabel } from "@/lib/events";
import { AppBadge, AppButton } from "@/components/design-system";
import { fmtDateTime } from "@/lib/format";

type FeaturedEventHeroProps = {
  event: EventListItem;
};

export function FeaturedEventHero({ event }: FeaturedEventHeroProps) {
  return (
    <section className="relative isolate animate-fade-up overflow-hidden rounded-3xl shadow-token-crimson">
      <div className="relative min-h-[360px] w-full overflow-hidden bg-secondary sm:min-h-[440px]">
        {event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
        ) : (
          <div className="absolute inset-0 grad-crimson" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(122,12,22,0.45) 50%, rgba(122,12,22,0.96) 100%)",
          }}
        />
        <div className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
          <span className="glass-surface-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Featured event
          </span>
        </div>
        {event.categoryName && (
          <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
            <span className="glass-surface rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
              {event.categoryName}
            </span>
          </div>
        )}
        <div className="relative z-10 flex min-h-[360px] flex-col justify-end p-6 sm:min-h-[440px] sm:p-10">
          <AppBadge variant="gold" className="w-fit bg-white/10 text-white">
            {registrationStatusLabel(event.registrationStatus)}
          </AppBadge>
          <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[var(--tracking-tight)] text-white sm:text-5xl">
            {event.title}
          </h2>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-white/90">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              {fmtDateTime(event.startsAt)}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
                {event.location}
              </span>
            )}
          </div>
          {event.capacity != null && (
            <p className="mt-3 text-sm font-semibold text-white/85">
              {event.spotsRemaining === 0 ? "At capacity" : `${event.spotsRemaining} of ${event.capacity} spots remaining`}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <AppButton variant="inverse" size="lg" shape="pill" asChild>
              <Link to="/events/$id" params={{ id: event.id }}>
                View Event <ArrowRight className="h-4 w-4" />
              </Link>
            </AppButton>
          </div>
        </div>
      </div>
    </section>
  );
}
