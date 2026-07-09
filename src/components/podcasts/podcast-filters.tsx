import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type PodcastFiltersProps = {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  className?: string;
};

export function PodcastFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  search,
  onSearchChange,
  className,
}: PodcastFiltersProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search episodes, guests, topics…"
          className="rounded-full pl-10"
          aria-label="Search podcast episodes"
        />
      </div>

      {categories.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          <FilterPill active={selectedCategory === null} onClick={() => onCategoryChange(null)}>
            All categories
          </FilterPill>
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
