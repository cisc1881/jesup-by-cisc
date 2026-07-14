import { ExternalLink, PlayCircle } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { CISC_TAB_CONTENT } from "@/content/cisc-tab-content";

export function CiscTabStory() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const story = CISC_TAB_CONTENT[pathname];
  if (!story) return null;

  return (
    <section
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14"
      aria-labelledby="cisc-tab-story-title"
    >
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-token-soft">
        <div className="grid gap-0 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] grad-gold-text">
              {story.eyebrow}
            </p>
            <h2
              id="cisc-tab-story-title"
              className="mt-3 max-w-3xl text-2xl font-black tracking-tight sm:text-3xl"
            >
              {story.title}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              {story.summary}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={story.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {story.sourceLabel}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              {story.videoUrl && (
                <a
                  href={story.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
                >
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
                  {story.videoLabel}
                </a>
              )}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Program information adapted from CISC’s public website. Confirm current dates,
              eligibility, and availability on the linked official page.
            </p>
          </div>
          <div className="border-t border-border/70 bg-secondary/45 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
              What you can explore
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {story.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
