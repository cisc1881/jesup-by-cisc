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
  const accent = event.themeAccent ?? "var(--institution-accent)";
  const secondary = event.themeSecondary ?? "var(--institution-secondary)";

  return (
    <section className="relative isolate animate-fade-up overflow-hidden rounded-3xl shadow-token-crimson">
      <div className="relative min-h-[360px] w-full overflow-hidden bg-secondary sm:min-h-[440px]">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
        ) : (
          <div className="absolute inset-0 grad-crimson" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(145deg, color-mix(in srgb, ${secondary} 28%, transparent) 0%, color-mix(in srgb, ${accent} 58%, transparent) 52%, color-mix(in srgb, ${accent} 94%, black) 100%)`,
          }}
        />
        <div className="relative z-10 flex min-h-[360px] flex-col justify-end p-6 sm:min-h-[440px] sm:p-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <span className="glass-surface-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Featured event
            </span>
            {event.categoryName && (
              <span className="glass-surface rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
                {event.categoryName}
              </span>
            )}
          </div>
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
              {event.spotsRemaining === 0
                ? "At capacity"
                : `${event.spotsRemaining} of ${event.capacity} spots remaining`}
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
