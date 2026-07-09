import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  variant?: "light" | "dark";
  className?: string;
};

export function BrandMark({ variant = "light", className }: BrandMarkProps) {
  const isLight = variant === "light";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg font-black tracking-tight",
          isLight
            ? "bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm"
            : "grad-crimson text-primary-foreground shadow-token-crimson",
        )}
        aria-hidden="true"
      >
        J
      </span>
      <div className="min-w-0">
        <div
          className={cn(
            "text-lg font-black tracking-[var(--tracking-tight)]",
            isLight ? "text-white" : "text-foreground",
          )}
        >
          JESUP
        </div>
        <div
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.16em]",
            isLight ? "text-white/70" : "text-muted-foreground",
          )}
        >
          Digital Extension Wagon
        </div>
      </div>
    </div>
  );
}
