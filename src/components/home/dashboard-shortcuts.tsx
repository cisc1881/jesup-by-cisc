import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, CloudSun, Headphones, MessageCircle, Newspaper, Ticket } from "lucide-react";
import { PodcastPlayer, PODCAST_PROGRESS_KEY } from "@/components/podcasts/podcast-player";
import { fetchPodcastBySlug } from "@/lib/podcasts";

type Progress = { slug: string; title: string; seconds: number };

export function DashboardShortcuts() {
  const [progress, setProgress] = useState<Progress | null>(null);
  useEffect(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem(PODCAST_PROGRESS_KEY) ?? "null",
      ) as Progress | null;
      if (value?.slug && value.seconds > 0) setProgress(value);
    } catch {
      /* Browser storage is optional. */
    }
  }, []);
  const { data: episode } = useQuery({
    queryKey: ["continue-podcast", progress?.slug],
    enabled: !!progress?.slug,
    queryFn: () => fetchPodcastBySlug(progress!.slug),
  });

  const links = [
    { to: "/me/wallet", label: "My tickets", icon: Ticket },
    { to: "/weather", label: "Local weather", icon: CloudSun },
    { to: "/news", label: "News", icon: Newspaper },
    { to: "/me/messages", label: "Messages", icon: MessageCircle },
  ];

  return (
    <div className="space-y-6">
      <nav aria-label="Your dashboard shortcuts" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex min-h-24 flex-col justify-between border border-border bg-card p-4 text-sm font-bold shadow-[var(--shadow-soft)] transition hover:border-primary"
          >
            <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="flex items-center justify-between gap-2">
              {label}
              <ArrowRight className="h-4 w-4 text-primary" />
            </span>
          </Link>
        ))}
      </nav>
      {progress && episode && (
        <section
          aria-labelledby="continue-listening-title"
          className="space-y-4 border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Pick up where you left off
              </p>
              <h2 id="continue-listening-title" className="mt-1 text-xl font-black">
                Continue listening
              </h2>
            </div>
            <Headphones className="h-6 w-6 text-primary" />
          </div>
          <Link
            to="/podcasts/$slug"
            params={{ slug: episode.slug }}
            className="font-bold text-primary hover:underline"
          >
            {episode.title}
          </Link>
          {episode.audioUrl ? (
            <PodcastPlayer audioUrl={episode.audioUrl} title={episode.title} slug={episode.slug} />
          ) : (
            <Link
              to="/podcasts/$slug"
              params={{ slug: episode.slug }}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary"
            >
              Open episode <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
