import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ProgramListItem } from "@/lib/programs";
import { AppButton, AppCard, SectionHeader } from "@/components/design-system";

type FeaturedProgramSpotlightProps = {
  program: ProgramListItem;
};

export function FeaturedProgramSpotlight({ program }: FeaturedProgramSpotlightProps) {
  const title = program.short ? `${program.short} ${program.name}`.trim() : program.name;

  return (
    <section aria-labelledby="featured-programs-heading" className="space-y-4">
      <SectionHeader title="Featured Programs" titleId="featured-programs-heading" />
      <div className="gold-divider" />
      <AppCard variant="lift" padding="none" className="overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="relative aspect-[16/9] shrink-0 bg-secondary sm:aspect-auto sm:w-2/5 sm:min-h-[220px]">
            {program.coverImageUrl ? (
              <img src={program.coverImageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grad-crimson" aria-hidden="true" />
            )}
          </div>
          <div className="flex flex-1 flex-col justify-center p-5 sm:p-8">
            <h3 className="text-2xl font-black tracking-[var(--tracking-tight)] text-foreground sm:text-3xl">
              {title || "Untitled program"}
            </h3>
            {program.tagline && (
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {program.tagline}
              </p>
            )}
            {program.slug ? (
              <AppButton variant="primary" size="lg" shape="pill" className="mt-6 w-fit" asChild>
                <Link to="/programs/$slug" params={{ slug: program.slug }}>
                  Explore <ArrowRight className="h-4 w-4" />
                </Link>
              </AppButton>
            ) : (
              <AppButton variant="primary" size="lg" shape="pill" className="mt-6 w-fit" disabled>
                Explore <ArrowRight className="h-4 w-4" />
              </AppButton>
            )}
          </div>
        </div>
      </AppCard>
    </section>
  );
}
