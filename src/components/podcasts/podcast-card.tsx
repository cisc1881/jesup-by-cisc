import { Link } from "@tanstack/react-router";
import { Clock, Mic, Play } from "lucide-react";
import type { PodcastListItem } from "@/lib/podcasts";
import { AppBadge, AppCard } from "@/components/design-system";
import { fmtDate, fmtDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

type PodcastCardProps = {
  episode: PodcastListItem;
  className?: string;
  variant?: "grid" | "row";
};

export function PodcastCard({ episode, className, variant = "grid" }: PodcastCardProps) {
  if (variant === "row") {
    return (
      <AppCard variant="lift" padding="sm" className={cn("group", className)}>
        <Link
          to="/podcasts/$slug"
          params={{ slug: episode.slug }}
          className="flex gap-4 sm:gap-5"
        >
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-28 sm:w-28">
            {episode.coverUrl ? (
              <img src={episode.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center grad-crimson text-primary-foreground">
                <Mic className="h-8 w-8 opacity-80" aria-hidden="true" />
              </div>
            )}
            <span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/25">
              <span className="grid h-10 w-10 translate-y-1 place-items-center rounded-full bg-white text-foreground opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100">
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              </span>
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-2">
              {episode.category && <AppBadge variant="secondary">{episode.category}</AppBadge>}
              {episode.isFeatured && <AppBadge variant="gold">Featured</AppBadge>}
            </div>
            <h3 className="mt-1 line-clamp-2 text-base font-bold text-foreground sm:text-lg">{episode.title}</h3>
            {episode.guest && <p className="text-xs font-medium text-muted-foreground">with {episode.guest}</p>}
            {episode.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{episode.description}</p>
            )}
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground">
              {episode.publishedAt && <span>{fmtDate(episode.publishedAt)}</span>}
              {episode.durationSeconds != null && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {fmtDuration(episode.durationSeconds)}
                </span>
              )}
            </div>
          </div>
        </Link>
      </AppCard>
    );
  }

  return (
    <AppCard variant="lift" padding="none" className={cn("flex h-full flex-col overflow-hidden", className)}>
      <Link to="/podcasts/$slug" params={{ slug: episode.slug }} className="block">
        <div className="relative aspect-square overflow-hidden bg-secondary">
          {episode.coverUrl ? (
            <img src={episode.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center grad-crimson text-primary-foreground">
              <Mic className="h-10 w-10 opacity-80" aria-hidden="true" />
            </div>
          )}
          <span className="absolute inset-0 grid place-items-center bg-black/0 transition hover:bg-black/25">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-foreground opacity-90 shadow-lg">
              <Play className="h-5 w-5 fill-current" aria-hidden="true" />
            </span>
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap gap-2">
          {episode.category && <AppBadge variant="secondary">{episode.category}</AppBadge>}
          {episode.isFeatured && <AppBadge variant="gold">Featured</AppBadge>}
        </div>
        <Link to="/podcasts/$slug" params={{ slug: episode.slug }}>
          <h3 className="line-clamp-2 text-lg font-bold text-foreground">{episode.title}</h3>
        </Link>
        {episode.guest && <p className="mt-1 text-sm font-medium text-muted-foreground">{episode.guest}</p>}
        {episode.description && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{episode.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 text-xs text-muted-foreground">
          {episode.publishedAt && <span>{fmtDate(episode.publishedAt)}</span>}
          {episode.durationSeconds != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {fmtDuration(episode.durationSeconds)}
            </span>
          )}
        </div>
      </div>
    </AppCard>
  );
}
