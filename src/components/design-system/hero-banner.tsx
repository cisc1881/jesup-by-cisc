import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroBannerProps = {
  imageUrl?: string;
  imageAlt?: string;
  height?: "sm" | "md" | "lg";
  overlay?: boolean;
  children?: ReactNode;
  className?: string;
};

const heights = {
  sm: "min-h-[280px] sm:min-h-[320px]",
  md: "min-h-[380px] sm:min-h-[440px]",
  lg: "min-h-[480px] sm:min-h-[560px]",
};

export function HeroBanner({
  imageUrl,
  imageAlt = "",
  height = "lg",
  overlay = true,
  children,
  className,
}: HeroBannerProps) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-none bg-primary",
        heights[height],
        className,
      )}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
      )}
      {overlay && <div className="absolute inset-0 hero-overlay" aria-hidden="true" />}
      {children && (
        <div className="relative z-10 flex h-full flex-col justify-end page-x pb-[var(--space-10)] pt-[var(--space-16)] text-primary-foreground">
          {children}
        </div>
      )}
    </section>
  );
}
