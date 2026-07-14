import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MediaCardProps = {
  imageUrl?: string | null;
  imageAlt?: string;
  fallbackClassName?: string;
  children: ReactNode;
  className?: string;
  aspect?: "video" | "square" | "portrait";
};

const aspects = {
  video: "aspect-[4/3]",
  square: "aspect-square",
  portrait: "aspect-[4/5]",
};

export function MediaCard({
  imageUrl,
  imageAlt = "",
  fallbackClassName = "grad-crimson",
  children,
  className,
  aspect = "video",
}: MediaCardProps) {
  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl bg-card shadow-token-soft transition hover:shadow-token-lift",
        className,
      )}
    >
      <div className={cn("relative w-full overflow-hidden bg-secondary", aspects[aspect])}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className={cn("h-full w-full", fallbackClassName)} aria-hidden="true" />
        )}
      </div>
      <div className="p-4">{children}</div>
    </article>
  );
}
