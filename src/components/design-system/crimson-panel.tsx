import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CrimsonPanelProps = {
  children: ReactNode;
  className?: string;
};

export function CrimsonPanel({ children, className }: CrimsonPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl grad-crimson shadow-token-crimson",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        aria-hidden="true"
        style={{
          backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
