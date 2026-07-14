import { HorizontalScroll, HorizontalScrollItem } from "@/components/design-system";
import { Skeleton } from "@/components/ui/skeleton";

function CarouselSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <HorizontalScroll gap="md">
      {Array.from({ length: cards }).map((_, index) => (
        <HorizontalScrollItem key={index} width="md">
          <div className="w-[78vw] overflow-hidden rounded-2xl shadow-token-soft sm:w-64">
            <Skeleton className="aspect-[3/4] w-full rounded-none animate-shimmer" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-4/5 animate-shimmer" />
              <Skeleton className="h-3 w-2/3 animate-shimmer" />
              <Skeleton className="mt-3 h-9 w-full rounded-full animate-shimmer" />
            </div>
          </div>
        </HorizontalScrollItem>
      ))}
    </HorizontalScroll>
  );
}

export function ProgramsPageSkeleton() {
  return (
    <div className="space-y-10 md:space-y-12" role="status" aria-label="Loading programs">
      <Skeleton className="h-[340px] w-full rounded-3xl sm:h-[400px] animate-shimmer" />

      <div className="space-y-4">
        <Skeleton className="h-11 w-full rounded-full animate-shimmer" />
        <div className="-mx-1 flex gap-2 overflow-hidden px-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-24 shrink-0 rounded-full animate-shimmer" />
          ))}
        </div>
      </div>

      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-4">
          <Skeleton className="h-7 w-44 animate-shimmer" />
          <div className="gold-divider opacity-40" />
          <CarouselSkeleton />
        </div>
      ))}
    </div>
  );
}
