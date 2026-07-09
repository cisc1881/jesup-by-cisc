import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  /** Tailwind max-width token or custom class */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  withBottomNavOffset?: boolean;
};

const sizes = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-[90rem]",
  full: "max-w-none",
};

export function PageContainer({
  children,
  className,
  size = "lg",
  withBottomNavOffset = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full page-x page-y",
        sizes[size],
        withBottomNavOffset && "pb-bottom-nav md:pb-[var(--page-py)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, eyebrow, action, className }: PageHeaderProps) {
  return (
    <div className={cn("border-b border-border/50 bg-card", className)}>
      <div className="mx-auto max-w-7xl page-x py-[var(--space-10)] sm:py-[var(--space-12)]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            {eyebrow && <div className="mb-3 text-eyebrow grad-gold-text">{eyebrow}</div>}
            <h1 className="text-4xl font-black tracking-[var(--tracking-tight)] text-foreground sm:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
            )}
          </div>
          {action}
        </div>
      </div>
    </div>
  );
}
