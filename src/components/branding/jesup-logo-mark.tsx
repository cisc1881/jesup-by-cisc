import { cn } from "@/lib/utils";
import {
  getJesupLogoSrc,
  JESUP_LOGO_DEFAULT_SRC,
  type JesupLogoTone,
} from "./jesup-logo-assets";

export { JESUP_LOGO_DEFAULT_SRC, JESUP_LOGO_GOLD_SRC, JESUP_LOGO_WHITE_SRC } from "./jesup-logo-assets";
export type { JesupLogoTone } from "./jesup-logo-assets";

export type JesupLogoMarkSize = "sm" | "md" | "lg" | "splash";

const sizeClasses: Record<JesupLogoMarkSize, { image: string; tagline: string }> = {
  sm: { image: "h-8 w-auto max-w-[10rem]", tagline: "text-[10px]" },
  md: { image: "h-10 w-auto max-w-[12rem] sm:h-12", tagline: "text-xs" },
  lg: { image: "h-12 w-auto max-w-[14rem] sm:h-14", tagline: "text-xs sm:text-sm" },
  splash: {
    image: "h-auto w-[min(280px,82vw)] sm:w-[min(340px,78vw)] md:w-[min(400px,72vw)]",
    tagline: "text-sm",
  },
};

export type JesupLogoMarkProps = {
  size?: JesupLogoMarkSize;
  src?: string;
  tone?: JesupLogoTone;
  showTagline?: boolean;
  className?: string;
  imageClassName?: string;
  glow?: boolean;
};

export function JesupLogoMark({
  size = "md",
  src,
  tone = "on-dark",
  showTagline = false,
  className,
  imageClassName,
  glow = false,
}: JesupLogoMarkProps) {
  const sizes = sizeClasses[size];
  const logoSrc = src ?? getJesupLogoSrc(tone);

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <div className={cn("relative max-w-full", glow && "jesup-logo-mark__glow")}>
        <img
          src={logoSrc}
          alt="JESUP by CISC"
          className={cn("max-w-full object-contain object-center", sizes.image, imageClassName)}
          width={1300}
          height={467}
          decoding="async"
        />
      </div>
      {showTagline && (
        <span className={cn("mt-4 font-medium tracking-wide text-muted-foreground", sizes.tagline)}>
          The Digital Extension Wagon
        </span>
      )}
    </div>
  );
}
