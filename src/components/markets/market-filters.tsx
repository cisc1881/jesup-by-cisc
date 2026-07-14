import type { MarketProductCategory } from "@/lib/markets";
import { MARKET_PRODUCT_CATEGORY_LABELS } from "@/lib/markets";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LayoutGrid, Map, Search } from "lucide-react";

export type MarketViewMode = "list" | "map";

type MarketFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  productCategory: MarketProductCategory | null;
  onProductCategoryChange: (category: MarketProductCategory | null) => void;
  viewMode: MarketViewMode;
  onViewModeChange: (mode: MarketViewMode) => void;
  showFavoritesOnly: boolean;
  onShowFavoritesOnlyChange: (value: boolean) => void;
  favoritesCount: number;
  className?: string;
};

const chipBase =
  "shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95";
const chipInactive =
  "glass-surface border-border/40 bg-background/70 text-foreground shadow-token-soft hover:bg-background/90";
const chipActive = "grad-crimson border-transparent text-primary-foreground shadow-token-crimson";

const categories = Object.entries(MARKET_PRODUCT_CATEGORY_LABELS) as [MarketProductCategory, string][];

export function MarketFilters({
  search,
  onSearchChange,
  productCategory,
  onProductCategoryChange,
  viewMode,
  onViewModeChange,
  showFavoritesOnly,
  onShowFavoritesOnlyChange,
  favoritesCount,
  className,
}: MarketFiltersProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search markets, cities, seasons…"
          className="h-11 rounded-full border-border/50 bg-background/80 pl-11 shadow-token-soft backdrop-blur-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onViewModeChange("list")}
          className={cn(chipBase, "inline-flex items-center gap-2", viewMode === "list" ? chipActive : chipInactive)}
        >
          <LayoutGrid className="h-4 w-4" />
          List
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("map")}
          className={cn(chipBase, "inline-flex items-center gap-2", viewMode === "map" ? chipActive : chipInactive)}
        >
          <Map className="h-4 w-4" />
          Map
        </button>
        <button
          type="button"
          onClick={() => onShowFavoritesOnlyChange(!showFavoritesOnly)}
          className={cn(chipBase, showFavoritesOnly ? chipActive : chipInactive)}
        >
          Favorites{favoritesCount > 0 ? ` (${favoritesCount})` : ""}
        </button>
      </div>

      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => onProductCategoryChange(null)}
          className={cn(chipBase, productCategory === null ? chipActive : chipInactive)}
        >
          All products
        </button>
        {categories.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onProductCategoryChange(value)}
            className={cn(chipBase, productCategory === value ? chipActive : chipInactive)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
