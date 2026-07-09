import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HorizontalScrollProps = {
  children: ReactNode;
  className?: string;
  /** Gap between items — defaults to mobile-first snap row */
  gap?: "sm" | "md";
};

const gaps = {
  sm: "gap-3",
  md: "gap-4",
};

export function HorizontalScroll({ children, className, gap = "md" }: HorizontalScrollProps) {
  return (
    <div
      className={cn(
        "-mx-[var(--page-px)] flex snap-x snap-mandatory overflow-x-auto px-[var(--page-px)] pb-1",
        "scrollbar-none [&::-webkit-scrollbar]:hidden",
        gaps[gap],
        className,
      )}
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
