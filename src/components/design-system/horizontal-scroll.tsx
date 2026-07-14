import { Children, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type HorizontalScrollProps = {
  children: ReactNode;
  className?: string;
  /** Gap between items — defaults to mobile-first snap row */
  gap?: "sm" | "md";
  "aria-label"?: string;
};

const gaps = {
  sm: "gap-3",
  md: "gap-4",
};

export function HorizontalScroll({ children, className, gap = "md", "aria-label": ariaLabel }: HorizontalScrollProps) {
  const itemCount = Children.count(children);
  const canScroll = itemCount > 1;

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={cn(
        "flex pb-1",
        canScroll
          ? "-mx-[var(--page-px)] snap-x snap-mandatory overflow-x-auto overscroll-x-contain px-[var(--page-px)] scrollbar-none [&::-webkit-scrollbar]:hidden"
          : "max-w-full touch-pan-y overflow-x-hidden",
        gaps[gap],
        className,
      )}
      data-scrollable={canScroll ? "true" : "false"}
    >
      {children}
    </div>
  );
}

type ScrollItemProps = {
  children: ReactNode;
  className?: string;
  /** Mobile card width as viewport fraction */
  width?: "sm" | "md" | "lg";
};

const widths = {
  sm: "w-[68vw] sm:w-auto",
  md: "w-[75vw] sm:w-auto",
  lg: "w-[85vw] sm:w-auto",
};

export function HorizontalScrollItem({ children, className, width = "md" }: ScrollItemProps) {
  return (
    <div className={cn("shrink-0 snap-start", widths[width], className)}>
      {children}
    </div>
  );
}
