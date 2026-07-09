import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const appCardVariants = cva("rounded-2xl bg-card text-card-foreground transition-shadow", {
  variants: {
    variant: {
      elevated: "border border-border/50 shadow-token-soft",
      lift: "border border-border/50 shadow-token-lift",
      outline: "border border-border bg-transparent shadow-none",
      ghost: "border-0 bg-secondary/40 shadow-none",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    variant: "elevated",
    padding: "md",
  },
});

export interface AppCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof appCardVariants> {}

export function AppCard({ className, variant, padding, ...props }: AppCardProps) {
  return <div className={cn(appCardVariants({ variant, padding, className }))} {...props} />;
}

export function AppCardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function AppCardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-bold tracking-[var(--tracking-tight)] text-foreground", className)}
      {...props}
    />
  );
}

export function AppCardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-relaxed text-muted-foreground", className)} {...props} />;
}

export function AppCardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-3", className)} {...props} />;
}

export { appCardVariants };
