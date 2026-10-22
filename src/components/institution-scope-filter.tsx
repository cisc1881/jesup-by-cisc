import { Building2, Globe2, School } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type InstitutionScope = "mine" | "all" | "other";

const options = [
  { value: "mine", label: "My institution", icon: School },
  { value: "all", label: "All 1890", icon: Globe2 },
  { value: "other", label: "Other institutions", icon: Building2 },
] as const;

export function InstitutionScopeFilter({
  value,
  onChange,
  hasInstitution,
}: {
  value: InstitutionScope;
  onChange: (value: InstitutionScope) => void;
  hasInstitution: boolean;
}) {
  return (
    <div className="grid grid-cols-3 border border-border bg-muted" aria-label="Institution scope">
      {options.map((option) => {
        const Icon = option.icon;
        const disabled = option.value !== "all" && !hasInstitution;
        return (
          <Button variant="ghost"
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-12 items-center justify-center gap-1.5 border-r border-border px-2 text-center text-[11px] font-bold leading-tight transition last:border-r-0 sm:text-sm",
              value === option.value
                ? "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground"
                : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              disabled && "cursor-not-allowed",
            )}
          >
            <Icon className="hidden h-4 w-4 shrink-0 sm:block" />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- Shared filter logic is intentionally colocated with its control.
export function matchesInstitutionScope(
  item: { institutionIds: string[]; networkWide: boolean },
  scope: InstitutionScope,
  institutionId: string | null,
) {
  if (scope === "all" || !institutionId) return true;
  if (scope === "mine") return item.networkWide || item.institutionIds.includes(institutionId);
  return (
    !item.networkWide &&
    item.institutionIds.length > 0 &&
    !item.institutionIds.includes(institutionId)
  );
}
