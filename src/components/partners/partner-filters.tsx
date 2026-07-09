import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PARTNERSHIP_FOCUS_AREAS } from "@/lib/partner-focus-areas";
import type { PartnerSortMode } from "@/lib/partners";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type PartnerFiltersProps = {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedFocusArea: string | null;
  onFocusAreaChange: (area: string | null) => void;
  sortMode: PartnerSortMode;
  onSortModeChange: (mode: PartnerSortMode) => void;
  search: string;
  onSearchChange: (value: string) => void;
  className?: string;
};

export function PartnerFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedFocusArea,
  onFocusAreaChange,
  sortMode,
  onSortModeChange,
  search,
  onSearchChange,
  className,
}: PartnerFiltersProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search partners…"
            className="rounded-full pl-10"
            aria-label="Search partners"
          />
        </div>
        <Select value={sortMode} onValueChange={(v) => onSortModeChange(v as PartnerSortMode)}>
          <SelectTrigger className="w-full rounded-full sm:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {categories.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          {categories.map((category) => (
            <FilterPill
              key={category}
              active={selectedCategory === category}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </FilterPill>
          ))}
        </div>
      )}

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
        <FilterPill active={!selectedFocusArea} onClick={() => onFocusAreaChange(null)}>
          All focus areas
        </FilterPill>
        {PARTNERSHIP_FOCUS_AREAS.map((area) => (
          <FilterPill
            key={area}
            active={selectedFocusArea === area}
            onClick={() => onFocusAreaChange(area)}
          >
            {area}
          </FilterPill>
        ))}
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
        active
          ? "grad-crimson text-primary-foreground shadow-token-crimson"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      )}
    >
      {children}
    </button>
  );
}
