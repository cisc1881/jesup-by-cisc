import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { PodcastAttachment, PodcastDetail } from "@/lib/podcasts";
import { AppBadge, SectionHeader } from "@/components/design-system";
import { fmtDate, fmtDateTime, fmtDuration } from "@/lib/format";
import { PodcastPlayer } from "./podcast-player";

export function PodcastDetailHero({ episode }: { episode: PodcastDetail }) {
  return (
    <section className="relative">
      <div className="relative min-h-[280px] overflow-hidden bg-secondary sm:min-h-[360px]">
        {episode.coverUrl ? (
          <img src={episode.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grad-crimson" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
        <div className="relative z-10 mx-auto max-w-4xl px-5 pb-10 pt-8 sm:px-8 sm:pb-12">
          <Link
            to="/podcasts"
            className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/25"
          >
            All episodes
          </Link>
          <div className="flex flex-wrap gap-2">
            {episode.category && <AppBadge variant="secondary">{episode.category}</AppBadge>}
            {episode.isFeatured && <AppBadge variant="gold">Featured</AppBadge>}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">{episode.title}</h1>
          {episode.guest && <p className="mt-3 text-sm text-white/85 sm:text-base">with {episode.guest}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/70">
            {episode.publishedAt && <span>{fmtDate(episode.publishedAt)}</span>}
            {episode.durationSeconds != null && <span>{fmtDuration(episode.durationSeconds)}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PodcastDetailBody({ episode }: { episode: PodcastDetail }) {
  return (
    <div className="space-y-8">
      <PodcastPlayer embedUrl={episode.embedUrl} audioUrl={episode.audioUrl} title={episode.title} />
      {episode.description && (
        <p className="text-base leading-relaxed text-foreground/85 sm:text-lg">{episode.description}</p>
      )}
    </div>
  );
}

export function PodcastRelatedSection({
  title,
  items,
}: {
  title: string;
  items: PodcastAttachment[];
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <SectionHeader title={title} />
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={item.href}
              params={item.hrefParams}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition hover:border-primary/20 hover:shadow-token-soft"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{item.title}</p>
                {item.subtitle && (
                  <p className="truncate text-xs text-muted-foreground">{fmtDateTime(item.subtitle)}</p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
