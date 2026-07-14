import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type SectionActionLinkProps = {
  to: string;
  children: ReactNode;
  className?: string;
};

export function SectionActionLink({ to, children, className }: SectionActionLinkProps) {
  return (
    <Link
      to={to}
      className={cn("shrink-0 text-sm font-semibold text-primary hover:underline", className)}
    >
      {children}
    </Link>
  );
}
