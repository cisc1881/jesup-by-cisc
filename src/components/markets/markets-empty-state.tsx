import { MapPin, SearchX, Store } from "lucide-react";
import { AppButton } from "@/components/design-system";
import { cn } from "@/lib/utils";

type MarketsEmptyStateProps = {
  variant?: "empty" | "no-results" | "favorites";
  onClearFilters?: () => void;
  className?: string;
};

export function MarketsEmptyState({ variant = "empty", onClearFilters, className }: MarketsEmptyStateProps) {
  const isNoResults = variant === "no-results";
  const isFavorites = variant === "favorites";
  const Icon = isNoResults ? SearchX : isFavorites ? MapPin : Store;

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
        {isFavorites ? "No favorite markets yet" : isNoResults ? "No matching markets" : "Markets coming soon"}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        {isFavorites
          ? "Tap the bookmark on any market card to save farmers markets you want to visit again."
          : isNoResults
            ? "Try adjusting your search, product filter, or location to discover more local markets."
            : "Farmers markets served by CISC Cooperative Extension will appear here once published."}
      </p>
      {isNoResults && onClearFilters && (
        <AppButton variant="outline" size="lg" shape="pill" className="mt-8" onClick={onClearFilters}>
          Clear filters
        </AppButton>
      )}
    </div>
  );
}
