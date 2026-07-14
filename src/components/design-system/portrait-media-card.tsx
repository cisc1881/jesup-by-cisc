import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PortraitMediaCardProps = {
  imageUrl?: string | null;
  imageAlt: string;
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  className?: string;
  widthClassName?: string;
  children?: ReactNode;
};

export function PortraitMediaCard({
  imageUrl,
  imageAlt,
  eyebrow,
  title,
  description,
  className,
  widthClassName = "w-[75vw] sm:w-56",
  children,
}: PortraitMediaCardProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl shadow-token-soft transition hover:shadow-token-lift",
        widthClassName,
        className,
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-secondary">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full grad-crimson" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          {eyebrow && (
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">{eyebrow}</div>
          )}
          <h3 className="mt-1 text-xl font-black tracking-[var(--tracking-tight)]">{title}</h3>
          {description && <p className="mt-1 line-clamp-2 text-xs text-white/80">{description}</p>}
        </div>
      </div>
      {children}
    </article>
  );
}
