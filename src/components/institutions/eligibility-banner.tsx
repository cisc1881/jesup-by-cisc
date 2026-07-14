import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const ELIGIBILITY_MESSAGE =
  "Students from Tuskegee University, all 1890 land-grant institutions, and other schools are encouraged to apply. Eligibility is not limited to Tuskegee University.";

type EligibilityBannerProps = {
  className?: string;
};

export function EligibilityBanner({ className }: EligibilityBannerProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground",
        className,
      )}
      role="note"
    >
      <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <p>{ELIGIBILITY_MESSAGE}</p>
    </div>
  );
}

export { ELIGIBILITY_MESSAGE };
