import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { ProgramDetail, ProgramListItem } from "@/lib/programs";
import { AppButton } from "@/components/design-system";
import { cn } from "@/lib/utils";

type ProgramCtaActionsProps = {
  program: Pick<ProgramListItem, "slug" | "registrationUrl" | "websiteUrl">;
  variant: "card" | "hero" | "hero-explore" | "detail";
  relatedEventId?: string | null;
  onDark?: boolean;
  className?: string;
};

export function ProgramCtaActions({ program, variant, relatedEventId, onDark, className }: ProgramCtaActionsProps) {
  if (variant === "card") {
    return (
      <AppButton
        variant="outline"
        size="sm"
        shape="pill"
        className={cn("pointer-events-none w-full sm:w-auto", className)}
        disabled={!program.slug}
      >
        Learn More <ArrowRight className="h-4 w-4" />
      </AppButton>
    );
  }

  if (variant === "hero" || variant === "hero-explore") {
    const label = variant === "hero-explore" ? "Explore" : "View Program";
    return (
      <div className={cn("flex flex-wrap gap-3", className)}>
        {program.slug ? (
          <AppButton variant="inverse" size="lg" shape="pill" asChild>
            <Link to="/programs/$slug" params={{ slug: program.slug }}>
              {label} <ArrowRight className="h-4 w-4" />
            </Link>
          </AppButton>
        ) : (
          <AppButton variant="inverse" size="lg" shape="pill" disabled>
            {label} <ArrowRight className="h-4 w-4" />
          </AppButton>
        )}
        {program.registrationUrl && (
          <AppButton
            variant="outline"
            size="lg"
            shape="pill"
            className="border-white/40 bg-white/10 text-white hover:bg-white/20"
            asChild
          >
            <a href={program.registrationUrl} target="_blank" rel="noreferrer">
              Register <ExternalLink className="h-4 w-4" />
            </a>
          </AppButton>
        )}
      </div>
    );
  }

  const outlineClass = onDark ? "border-white/40 bg-white/10 text-white hover:bg-white/20" : undefined;
  const learnOutlineClass = onDark ? outlineClass : undefined;

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {program.websiteUrl && (
        <AppButton variant="outline" size="lg" shape="pill" className={outlineClass} asChild>
          <a href={program.websiteUrl} target="_blank" rel="noreferrer">
            View Program <ExternalLink className="h-4 w-4" />
          </a>
        </AppButton>
      )}
      {program.registrationUrl && (
        <AppButton
          variant={onDark ? "inverse" : "primary"}
          size="lg"
          shape="pill"
          asChild
        >
          <a href={program.registrationUrl} target="_blank" rel="noreferrer">
            Register <ExternalLink className="h-4 w-4" />
          </a>
        </AppButton>
      )}
      {relatedEventId ? (
        <AppButton variant="outline" size="lg" shape="pill" className={learnOutlineClass} asChild>
          <Link to="/events/$id" params={{ id: relatedEventId }}>
            Learn More <ArrowRight className="h-4 w-4" />
          </Link>
        </AppButton>
      ) : (
        <AppButton variant="outline" size="lg" shape="pill" className={learnOutlineClass} asChild>
          <Link to="/programs">
            Learn More <ArrowRight className="h-4 w-4" />
          </Link>
        </AppButton>
      )}
    </div>
  );
}

export function ProgramCtaBar({
  program,
  className,
  onDark = false,
}: {
  program: ProgramDetail;
  className?: string;
  onDark?: boolean;
}) {
  return (
    <ProgramCtaActions
      program={program}
      variant="detail"
      relatedEventId={program.events[0]?.id ?? null}
      onDark={onDark}
      className={className}
    />
  );
}
