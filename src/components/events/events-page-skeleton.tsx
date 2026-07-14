import { HorizontalScroll, HorizontalScrollItem } from "@/components/design-system";
import { Skeleton } from "@/components/ui/skeleton";

function CarouselSkeleton() {
  return (
    <HorizontalScroll>
      {Array.from({ length: 3 }).map((_, index) => (
        <HorizontalScrollItem key={index} width="md">
          <Skeleton className="h-[300px] w-[78vw] rounded-2xl animate-shimmer sm:w-72" />
        </HorizontalScrollItem>
      ))}
    </HorizontalScroll>
  );
}

export function EventsPageSkeleton() {
  return (
    <div className="space-y-10" role="status" aria-label="Loading events">
      <Skeleton className="h-[360px] w-full rounded-3xl animate-shimmer" />
      <div className="space-y-4">
        <Skeleton className="h-11 w-full rounded-full animate-shimmer" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full animate-shimmer" />
          ))}
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-7 w-40 animate-shimmer" />
          <CarouselSkeleton />
        </div>
      ))}
    </div>
  );
}
