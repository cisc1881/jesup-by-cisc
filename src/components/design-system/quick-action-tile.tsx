import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type QuickActionTileProps = {
  to: string;
  label: string;
  icon: LucideIcon;
  className?: string;
};

export function QuickActionTile({ to, label, icon: Icon, className }: QuickActionTileProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex flex-col items-center gap-2.5 rounded-2xl bg-card p-4 shadow-token-soft transition",
        "active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-token-lift",
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl grad-crimson text-primary-foreground shadow-token-crimson transition group-hover:scale-105">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-center text-xs font-semibold text-foreground">{label}</span>
    </Link>
  );
}
