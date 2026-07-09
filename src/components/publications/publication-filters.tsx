import type { PublicationCategory } from "@/lib/publications";
import { PUBLICATION_CONTENT_TYPES } from "@/lib/publication-content-types";
import type { PublicationContentType } from "@/lib/publication-content-types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type PublicationFiltersProps = {
  categories: PublicationCategory[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  selectedContentType: PublicationContentType | null;
  onContentTypeChange: (type: PublicationContentType | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  className?: string;
};

export function PublicationFilters({
  categories,
  selectedCategoryId,
  onCategoryChange,
  selectedContentType,
  onContentTypeChange,
  search,
  onSearchChange,
  className,
}: PublicationFiltersProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search publications…"
          className="rounded-full pl-10"
          aria-label="Search publications"
        />
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
        <FilterPill active={selectedContentType === null} onClick={() => onContentTypeChange(null)}>
          All types
        </FilterPill>
        {PUBLICATION_CONTENT_TYPES.map((type) => (
          <FilterPill
            key={type.value}
            active={selectedContentType === type.value}
            onClick={() => onContentTypeChange(type.value)}
          >
            {type.label}
          </FilterPill>
        ))}
      </div>

      {categories.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          <FilterPill active={selectedCategoryId === null} onClick={() => onCategoryChange(null)}>
            All categories
          </FilterPill>
          {categories.map((category) => (
            <FilterPill
              key={category.id}
              active={selectedCategoryId === category.id}
              onClick={() => onCategoryChange(category.id)}
            >
              {category.name}
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
