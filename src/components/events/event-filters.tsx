import type { EventCategory } from "@/lib/events";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CalendarDays, LayoutGrid, Map, Search } from "lucide-react";

export type EventViewMode = "list" | "calendar" | "map";

type EventFiltersProps = {
  categories: EventCategory[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: EventViewMode;
  onViewModeChange: (mode: EventViewMode) => void;
  showSavedOnly: boolean;
  onShowSavedOnlyChange: (value: boolean) => void;
  savedCount: number;
  className?: string;
};

const chipBase =
  "shrink-0 border border-border px-4 py-2.5 text-sm font-semibold transition-colors";
const chipInactive = "bg-background text-foreground hover:bg-muted";
const chipActive = "institution-accent-bg border-transparent";

const viewModes: { id: EventViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { id: "list", label: "List", icon: LayoutGrid },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "map", label: "Map", icon: Map },
];

export function EventFilters({
  categories,
  selectedCategoryId,
  onCategoryChange,
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  showSavedOnly,
  onShowSavedOnlyChange,
  savedCount,
  className,
}: EventFiltersProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search events…"
          className="h-14 rounded-none border-x-0 border-border bg-background pl-11 text-base shadow-none"
          aria-label="Search events"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {viewModes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onViewModeChange(id)}
            className={cn(
              chipBase,
              "inline-flex items-center gap-2",
              viewMode === id ? chipActive : chipInactive,
            )}
            aria-pressed={viewMode === id}
          >
            <Icon className={cn("h-4 w-4", viewMode !== id && "text-primary")} />
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onShowSavedOnlyChange(!showSavedOnly)}
          className={cn(chipBase, showSavedOnly ? chipActive : chipInactive)}
          aria-pressed={showSavedOnly}
        >
          Saved{savedCount > 0 ? ` (${savedCount})` : ""}
        </button>
      </div>

      {categories.length > 0 && (
        <div
          className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 scrollbar-none"
          role="group"
          aria-label="Filter by category"
        >
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className={cn(chipBase, selectedCategoryId === null ? chipActive : chipInactive)}
            aria-pressed={selectedCategoryId === null}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                chipBase,
                selectedCategoryId === category.id ? chipActive : chipInactive,
              )}
              aria-pressed={selectedCategoryId === category.id}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
