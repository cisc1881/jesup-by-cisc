import { Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquareText } from "lucide-react";
import type { ProgramDetail, ProgramListItem } from "@/lib/programs";
import { AppButton } from "@/components/design-system";
import { cn } from "@/lib/utils";

type ProgramCtaActionsProps = {
  program: Pick<ProgramListItem, "id" | "slug" | "registrationUrl" | "websiteUrl">;
  variant: "card" | "hero" | "hero-explore" | "detail";
  relatedEventId?: string | null;
  onDark?: boolean;
  className?: string;
};

export function ProgramCtaActions({
  program,
  variant,
  relatedEventId,
  onDark,
  className,
}: ProgramCtaActionsProps) {
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
      </div>
    );
  }

  const outlineClass = onDark
    ? "border-white/40 bg-white/10 text-white hover:bg-white/20"
    : undefined;
  const learnOutlineClass = onDark ? outlineClass : undefined;

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <AppButton variant={onDark ? "inverse" : "primary"} size="lg" shape="pill" asChild>
        <Link to="/join" search={{ inquiryType: "join_program", programId: program.id }}>
          Join this program <ArrowRight className="h-4 w-4" />
        </Link>
      </AppButton>
      <AppButton variant="outline" size="lg" shape="pill" className={outlineClass} asChild>
        <Link to="/join" search={{ inquiryType: "request_info", programId: program.id }}>
          Ask a question <MessageSquareText className="h-4 w-4" />
        </Link>
      </AppButton>
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
