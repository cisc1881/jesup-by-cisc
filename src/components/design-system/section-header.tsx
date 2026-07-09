import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  titleId?: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
};

export function SectionHeader({
  title,
  titleId,
  eyebrow,
  description,
  action,
  className,
  titleClassName,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-[var(--section-gap)] flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-eyebrow grad-gold-text">{eyebrow}</div>}
        <h2
          id={titleId}
          className={cn(
            "text-2xl font-black tracking-[var(--tracking-tight)] text-foreground sm:text-3xl",
            titleClassName,
          )}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
