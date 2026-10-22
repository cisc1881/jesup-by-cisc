import type { ProgramCategory } from "@/lib/programs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProgramFiltersProps = {
  categories: ProgramCategory[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  className?: string;
};

const chipBase =
  "shrink-0 border border-border px-4 py-2.5 text-sm font-semibold transition-colors";

const chipInactive = "bg-background text-foreground hover:bg-muted";

const chipActive = "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground border-transparent";

export function ProgramFilters({
  categories,
  selectedCategoryId,
  onCategoryChange,
  search,
  onSearchChange,
  className,
}: ProgramFiltersProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search programs…"
          className="h-14 rounded-none border-x-0 border-border bg-background pl-11 text-base shadow-none"
          aria-label="Search programs"
        />
      </div>

      {categories.length > 0 && (
        <div
          className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 scrollbar-none"
          role="group"
          aria-label="Filter by category"
        >
          <Button variant="ghost"
            type="button"
            onClick={() => onCategoryChange(null)}
            className={cn(chipBase, selectedCategoryId === null ? chipActive : chipInactive)}
            aria-pressed={selectedCategoryId === null}
          >
            Active
          </Button>
          {categories.map((category) => (
            <Button variant="ghost"
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
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function filterPrograms<
  T extends {
    name: string;
    tagline?: string | null;
    short?: string | null;
    categoryId?: string | null;
  },
>(programs: T[], search: string, categoryId: string | null): T[] {
  const q = search.trim().toLowerCase();
  return programs.filter((program) => {
    const matchesCategory = !categoryId || program.categoryId === categoryId;
    const matchesSearch =
      !q ||
      [program.name, program.tagline, program.short]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });
}
