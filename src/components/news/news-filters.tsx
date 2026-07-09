import { Input } from "@/components/ui/input";
import { FilterPill } from "@/components/design-system";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type NewsFiltersProps = {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  className?: string;
};

export function NewsFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  search,
  onSearchChange,
  className,
}: NewsFiltersProps) {
  return (
    <div className={cn("space-y-4", className)} role="search">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search news & stories…"
          className="rounded-full pl-10"
          aria-label="Search news and stories"
        />
      </div>

      {categories.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none" role="group" aria-label="News categories">
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
