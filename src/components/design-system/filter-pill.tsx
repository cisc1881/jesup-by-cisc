import { cn } from "@/lib/utils";

type FilterPillProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
};

/** Accessible filter chip — use across public list pages. */
export function FilterPill({ active, onClick, children, className }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "grad-crimson text-primary-foreground shadow-token-crimson"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        className,
      )}
    >
      {children}
    </button>
  );
}
