import { Link } from "@tanstack/react-router";
import { Clock, Mic, Play } from "lucide-react";
import type { HomePodcastEpisode, HomeSectionMeta } from "@/lib/home";
import { fmtDate, fmtDuration } from "@/lib/format";
import { AppButton, AppCard, EmptyState, HomeSection, SectionActionLink } from "@/components/design-system";

type FeaturedPodcastSectionProps = {
  episode: HomePodcastEpisode | null;
  meta: HomeSectionMeta;
  isLoading?: boolean;
};

export function FeaturedPodcastSection({ episode, meta, isLoading }: FeaturedPodcastSectionProps) {
  if (isLoading) {
    return (
      <HomeSection sectionId={meta.id} meta={meta}>
        <AppCard variant="lift" padding="none" className="overflow-hidden">
          <div className="h-48 animate-pulse bg-secondary" />
        </AppCard>
      </HomeSection>
    );
  }

  if (!episode) {
    return (
      <HomeSection sectionId={meta.id} meta={meta}>
        <EmptyState
          icon={Mic}
          title={meta.emptyTitle ?? meta.title}
          description={meta.emptyDescription ?? undefined}
          action={
            meta.viewAllRoute && meta.viewAllLabel ? (
              <SectionActionLink to={meta.viewAllRoute}>{meta.viewAllLabel}</SectionActionLink>
            ) : undefined
          }
        />
      </HomeSection>
    );
  }

  return (
    <HomeSection sectionId={meta.id} meta={meta}>
      <AppCard variant="lift" padding="none" className="overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-secondary sm:w-44 md:w-52">
            {episode.coverUrl ? (
              <img src={episode.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center grad-crimson text-primary-foreground">
                <Mic className="h-10 w-10 opacity-80" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            {episode.publishedAt && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] grad-gold-text">
                {fmtDate(episode.publishedAt)}
              </p>
            )}
            <h3 className="mt-1 text-xl font-black tracking-[var(--tracking-tight)] text-foreground line-clamp-2">
              {episode.title}
            </h3>
            {episode.guest && (
              <p className="mt-1 text-sm font-medium text-muted-foreground">{episode.guest}</p>
            )}
            {episode.description && (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{episode.description}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <AppButton variant="primary" size="md" shape="pill" asChild>
                <Link to="/podcast">
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  {episode.title}
                </Link>
              </AppButton>
              {episode.durationSeconds != null && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {fmtDuration(episode.durationSeconds)}
                </span>
              )}
            </div>
          </div>
        </div>
      </AppCard>
    </HomeSection>
  );
}
