import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { cn } from "@/lib/utils";

type MarketsPullRefreshProps = {
  children: ReactNode;
  onRefresh: () => Promise<unknown>;
  disabled?: boolean;
  className?: string;
};

export function MarketsPullRefresh({ children, onRefresh, disabled, className }: MarketsPullRefreshProps) {
  const { distance, isRefreshing, isPulling, progress, handlers } = usePullToRefresh({ onRefresh, disabled });
  const showIndicator = isPulling || isRefreshing;

  return (
    <div
      className={cn("relative touch-pan-y", className)}
      onTouchStart={handlers.onTouchStart}
      onTouchMove={handlers.onTouchMove}
      onTouchEnd={handlers.onTouchEnd}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center transition-opacity duration-200",
          showIndicator ? "opacity-100" : "opacity-0",
        )}
        style={{ height: Math.max(distance, 0) }}
      >
        <div
          className="mt-3 flex h-9 w-9 items-center justify-center rounded-full glass-surface shadow-token-soft"
          style={{ transform: `scale(${0.85 + progress * 0.15})`, opacity: 0.4 + progress * 0.6 }}
        >
          <Loader2 className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
        </div>
      </div>
      <div className="transition-transform duration-200 ease-out" style={{ transform: showIndicator ? `translateY(${distance}px)` : undefined }}>
        {children}
      </div>
    </div>
  );
}
