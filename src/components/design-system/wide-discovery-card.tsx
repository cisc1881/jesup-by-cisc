import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type WideDiscoveryCardProps = {
  href: string;
  title: string;
  imageUrl?: string | null;
  imageAlt?: string;
  eyebrow?: string;
  detail?: string | null;
  className?: string;
};

/** Shared image-led card for real catalog content. */
export function WideDiscoveryCard({
  href,
  title,
  imageUrl,
  imageAlt = "",
  eyebrow,
  detail,
  className,
}: WideDiscoveryCardProps) {
  return (
    <a
      href={href}
      className={cn(
        "group block min-w-0 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,#080808,#282828)] text-sm font-semibold text-white/70">
            JESUP
          </div>
        )}
        <span
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/20"
          aria-hidden="true"
        />
        <div className="absolute inset-x-4 bottom-4 text-white sm:inset-x-5 sm:bottom-5">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/85">{eyebrow}</p>
          )}
          <h3 className="mt-1 line-clamp-2 text-lg font-extrabold sm:text-xl">{title}</h3>
        </div>
      </div>
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          {detail && <p className="line-clamp-2 text-sm text-muted-foreground">{detail}</p>}
          {!detail && <p className="text-sm font-semibold text-primary">View details</p>}
        </div>
        <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      </div>
    </a>
  );
}
