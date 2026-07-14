import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const appButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "grad-crimson text-primary-foreground shadow-token-crimson hover:opacity-95",
        secondary: "bg-secondary text-secondary-foreground shadow-token-soft hover:bg-secondary/80",
        outline: "border border-border bg-background text-foreground shadow-token-soft hover:bg-secondary/60",
        ghost: "text-foreground hover:bg-secondary/70",
        gold: "bg-accent text-accent-foreground shadow-token-soft hover:opacity-90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        inverse: "bg-card text-primary shadow-token-soft hover:bg-card/90",
      },
      size: {
        sm: "h-8 px-3.5 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
      shape: {
        pill: "rounded-[var(--btn-radius)]",
        square: "rounded-[var(--btn-radius-square)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      shape: "pill",
    },
  },
);

export interface AppButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof appButtonVariants> {
  asChild?: boolean;
}

export const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(appButtonVariants({ variant, size, shape, className }))}
        {...props}
      />
    );
  },
);
AppButton.displayName = "AppButton";

export { appButtonVariants };
