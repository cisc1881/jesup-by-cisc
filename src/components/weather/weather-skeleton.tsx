import { Skeleton } from "@/components/ui/skeleton";
import { AppCard } from "@/components/design-system";

export function WeatherSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading weather">
      <Skeleton className="h-6 w-48" />
      <div className="grid gap-4 lg:grid-cols-2">
        <AppCard padding="md" className="space-y-4">
          <Skeleton className="h-16 w-32" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </AppCard>
        <AppCard padding="md" className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
        </AppCard>
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
    </div>
  );
}
