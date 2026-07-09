import { CalendarX, SearchX } from "lucide-react";
import { AppButton } from "@/components/design-system";
import { cn } from "@/lib/utils";

type EventsEmptyStateProps = {
  variant?: "empty" | "no-results" | "saved";
  onClearFilters?: () => void;
  className?: string;
};

export function EventsEmptyState({ variant = "empty", onClearFilters, className }: EventsEmptyStateProps) {
  const isNoResults = variant === "no-results";
  const isSaved = variant === "saved";
  const Icon = isNoResults ? SearchX : CalendarX;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-14 text-center shadow-token-soft sm:px-12 sm:py-20",
        className,
      )}
    >
      <div className="relative mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl glass-surface shadow-token-lift">
        <Icon className="h-9 w-9 text-primary" />
      </div>
      <h3 className="text-2xl font-black tracking-[var(--tracking-tight)] text-foreground">
        {isSaved ? "No saved events yet" : isNoResults ? "No matching events" : "Events coming soon"}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        {isSaved
          ? "Tap the bookmark on any event card to save workshops, trainings, and community gatherings for later."
          : isNoResults
            ? "Try adjusting your search, category, or view to discover more CISC programming."
            : "Workshops, conferences, trainings, and field demonstrations will appear here once published."}
      </p>
      {isNoResults && onClearFilters && (
        <AppButton variant="outline" size="lg" shape="pill" className="mt-8" onClick={onClearFilters}>
          Clear filters
        </AppButton>
      )}
    </div>
  );
}
