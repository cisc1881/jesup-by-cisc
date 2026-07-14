import { cn } from "@/lib/utils";
import { JesupLogoMark } from "@/components/branding";

type BrandMarkProps = {
  variant?: "light" | "dark";
  className?: string;
};

export function BrandMark({ variant = "light", className }: BrandMarkProps) {
  const isLight = variant === "light";

  return (
    <JesupLogoMark
      size="md"
      tone={isLight ? "on-dark" : "on-light"}
      className={cn("items-start", className)}
      imageClassName="h-12 max-w-[13rem] sm:h-14 sm:max-w-[15rem]"
    />
  );
}
