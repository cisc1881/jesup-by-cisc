import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const appBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-transparent grad-crimson text-primary-foreground",
        gold: "border-accent/25 bg-accent/10 text-accent",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface AppBadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof appBadgeVariants> {}

export function AppBadge({ className, variant, ...props }: AppBadgeProps) {
  return <span className={cn(appBadgeVariants({ variant, className }))} {...props} />;
}

export { appBadgeVariants };
