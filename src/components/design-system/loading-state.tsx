import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type LoadingStateProps = {
  label?: string;
  className?: string;
};

export function LoadingState({ label = "Loading…", className }: LoadingStateProps) {
  return (
    <div
      className={cn("flex items-center justify-center py-12 text-sm text-muted-foreground", className)}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{label}</span>
    </div>
  );
}

type LoadingSkeletonProps = {
  rows?: number;
  className?: string;
};

export function LoadingSkeleton({ rows = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  );
}

type LoadingCardGridProps = {
  count?: number;
  className?: string;
};

export function LoadingCardGrid({ count = 3, className }: LoadingCardGridProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)} role="status" aria-label="Loading cards">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-2xl" />
      ))}
    </div>
  );
}
