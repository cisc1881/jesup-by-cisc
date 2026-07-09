import { cn } from "@/lib/utils";

type StatGridProps = {
  stats: { id: string; label: string; value: number }[];
  className?: string;
};

export function StatGrid({ stats, className }: StatGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4", className)}>
      {stats.map((s) => (
        <div
          key={s.id}
          className="flex flex-col items-center rounded-2xl bg-card/10 px-3 py-5 text-center backdrop-blur-sm sm:px-4 sm:py-6"
        >
          <div className="text-3xl font-black tracking-[var(--tracking-tight)] text-primary-foreground sm:text-4xl">
            {s.value.toLocaleString()}
          </div>
          <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground/75">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
