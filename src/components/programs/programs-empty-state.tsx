import { LayoutGrid, SearchX } from "lucide-react";
import { AppButton } from "@/components/design-system";
import { cn } from "@/lib/utils";

type ProgramsEmptyStateProps = {
  variant?: "empty" | "no-results";
  onClearFilters?: () => void;
  className?: string;
};

export function ProgramsEmptyState({
  variant = "empty",
  onClearFilters,
  className,
}: ProgramsEmptyStateProps) {
  const isNoResults = variant === "no-results";
  const Icon = isNoResults ? SearchX : LayoutGrid;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60 bg-card px-6 py-14 text-center shadow-token-soft sm:px-12 sm:py-20",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, var(--color-accent) 0%, transparent 70%)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl glass-surface shadow-token-lift">
        <Icon className="h-9 w-9 text-primary" aria-hidden="true" />
      </div>

      <h3 className="relative text-2xl font-black tracking-[var(--tracking-tight)] text-foreground">
        {isNoResults ? "No matching programs" : "Programs coming soon"}
      </h3>
      <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        {isNoResults
          ? "Try adjusting your search or category filter to discover more signature initiatives."
          : "Published programs from the Carver Integrative Sustainability Center will appear here."}
      </p>

      {isNoResults && onClearFilters && (
        <AppButton variant="outline" size="lg" shape="pill" className="relative mt-8" onClick={onClearFilters}>
          Clear filters
        </AppButton>
      )}
    </div>
  );
}
