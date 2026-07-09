import { Link } from "@tanstack/react-router";
import { Bookmark, MapPin } from "lucide-react";
import type { EventListItem } from "@/lib/events";
import { registrationStatusLabel } from "@/lib/events";
import { AppBadge, AppButton, AppCard } from "@/components/design-system";
import { cn } from "@/lib/utils";

type EventCardProps = {
  event: EventListItem;
  className?: string;
  animationIndex?: number;
  saved?: boolean;
  onToggleSaved?: () => void;
};

function formatEventDate(iso: string) {
  const date = new Date(iso);
  return {
    month: date.toLocaleString(undefined, { month: "short" }).toUpperCase(),
    day: date.getDate(),
    time: date.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

function registrationBadgeVariant(event: EventListItem): "default" | "gold" | "muted" | "outline" {
  if (event.registrationStatus === "open") return "gold";
  if (event.registrationStatus === "waiting_list") return "outline";
  return "muted";
}

export function EventCard({ event, className, animationIndex = 0, saved, onToggleSaved }: EventCardProps) {
  const date = formatEventDate(event.startsAt);
  const isFull = event.capacity != null && event.spotsRemaining === 0 && event.registrationStatus !== "waiting_list";

  return (
    <AppCard
      variant="lift"
      padding="none"
      className={cn(
        "group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-token-lift active:scale-[0.98] animate-fade-up",
        className,
      )}
      style={{ animationDelay: `${animationIndex * 90}ms` }}
    >
      <Link
        to="/events/$id"
        params={{ id: event.id }}
        className="absolute inset-0 z-[1] rounded-[inherit]"
        aria-label={`View ${event.title}`}
      />

      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full grad-crimson" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 100%)",
          }}
        />
        <div className="pointer-events-none absolute left-3 top-3 glass-surface-dark rounded-2xl px-3 py-2 text-center text-white">
          <div className="text-[10px] font-bold tracking-wide">{date.month}</div>
          <div className="text-2xl font-black leading-none">{date.day}</div>
        </div>
        {onToggleSaved && (
          <button
            type="button"
            onClick={onToggleSaved}
            className={cn(
              "absolute right-3 top-3 z-[2] grid h-10 w-10 place-items-center rounded-full glass-surface transition",
              saved && "text-accent",
            )}
            aria-label={saved ? "Remove from saved" : "Save event"}
          >
            <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
          </button>
        )}
        {event.categoryName && (
          <span className="pointer-events-none absolute bottom-3 left-3 glass-surface rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            {event.categoryName}
          </span>
        )}
      </div>

      <div className="relative z-0 flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2">
          <AppBadge variant={registrationBadgeVariant(event)}>{registrationStatusLabel(event.registrationStatus)}</AppBadge>
          {isFull && <AppBadge variant="muted">Sold Out</AppBadge>}
        </div>
        <h3 className="mt-2 line-clamp-2 text-lg font-black tracking-[var(--tracking-tight)] text-foreground">{event.title}</h3>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">{date.time}</p>
        {event.location && (
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="line-clamp-2">{event.location}</span>
          </p>
        )}
        {event.capacity != null && (
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-foreground/70">
            {event.spotsRemaining === 0 ? "At capacity" : `${event.spotsRemaining} spots left`}
          </p>
        )}
        <div className="mt-auto pt-4">
          <AppButton variant="outline" size="sm" shape="pill" className="pointer-events-none w-full">
            View Event
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
}
