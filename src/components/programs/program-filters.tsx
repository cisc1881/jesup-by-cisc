import type { ProgramCategory } from "@/lib/programs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type ProgramFiltersProps = {
  categories: ProgramCategory[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  className?: string;
};

const chipBase =
  "shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95";

const chipInactive =
  "glass-surface border-border/40 bg-background/70 text-foreground shadow-token-soft hover:bg-background/90";

const chipActive = "grad-crimson border-transparent text-primary-foreground shadow-token-crimson";

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
          className="h-11 rounded-full border-border/50 bg-background/80 pl-11 shadow-token-soft backdrop-blur-sm"
          aria-label="Search programs"
        />
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
            Active
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.id)}
              className={cn(chipBase, selectedCategoryId === category.id ? chipActive : chipInactive)}
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

export function filterPrograms<
  T extends { name: string; tagline?: string | null; short?: string | null; categoryId?: string | null },
>(programs: T[], search: string, categoryId: string | null): T[] {
  const q = search.trim().toLowerCase();
  return programs.filter((program) => {
    const matchesCategory = !categoryId || program.categoryId === categoryId;
    const matchesSearch =
      !q ||
      [program.name, program.tagline, program.short].filter(Boolean).some((value) =>
        value!.toLowerCase().includes(q),
      );
    return matchesCategory && matchesSearch;
  });
}
