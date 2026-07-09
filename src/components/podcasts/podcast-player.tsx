import { cn } from "@/lib/utils";

type PodcastPlayerProps = {
  embedUrl?: string | null;
  audioUrl?: string | null;
  title: string;
  className?: string;
};

function normalizeEmbedSrc(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("<iframe")) {
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    return match?.[1] ?? null;
  }
  return trimmed;
}

export function PodcastPlayer({ embedUrl, audioUrl, title, className }: PodcastPlayerProps) {
  const embedSrc = embedUrl ? normalizeEmbedSrc(embedUrl) : null;

  if (embedSrc) {
    return (
      <div className={cn("overflow-hidden rounded-2xl bg-secondary shadow-token-soft", className)}>
        <iframe
          title={`${title} player`}
          src={embedSrc}
          className="aspect-[16/9] w-full border-0 sm:aspect-[21/9]"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
    );
  }

  if (audioUrl) {
    return (
      <div className={cn("rounded-2xl border border-border/60 bg-card p-4 shadow-token-soft", className)}>
        <audio controls preload="metadata" className="w-full" src={audioUrl}>
          Your browser does not support audio playback.
        </audio>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-secondary/50 px-6 py-10 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      Audio player will appear when an embed URL or audio file is added.
    </div>
  );
}
