import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const appButtonVariants = cva(
  "inline-flex max-w-full items-center justify-center gap-2 whitespace-normal font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "grad-crimson text-primary-foreground shadow-token-crimson hover:opacity-95",
        secondary: "border border-primary/45 bg-primary/10 text-primary shadow-token-soft hover:bg-primary/20",
        outline: "border border-primary/55 bg-background text-primary shadow-token-soft hover:bg-primary/10",
        ghost: "text-primary hover:bg-primary/10",
        gold: "bg-primary text-primary-foreground shadow-token-crimson hover:opacity-90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        inverse: "bg-primary text-primary-foreground shadow-token-crimson hover:bg-primary/90",
      },
      size: {
        sm: "min-h-11 px-3.5 py-2 text-xs",
        md: "min-h-11 px-5 py-2 text-sm",
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
