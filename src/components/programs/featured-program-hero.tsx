import { Sparkles } from "lucide-react";
import type { ProgramListItem } from "@/lib/programs";
import { ProgramCtaActions } from "@/components/programs/program-cta-actions";
import { ProgramStatistics } from "@/components/programs/program-statistics";

type FeaturedProgramHeroProps = {
  program: ProgramListItem;
  /** Primary CTA style on the list page hero */
  ctaMode?: "view" | "explore";
};

export function FeaturedProgramHero({ program, ctaMode = "explore" }: FeaturedProgramHeroProps) {
  const title = program.short ? `${program.short} ${program.name}`.trim() : program.name;

  return (
    <section className="relative isolate animate-fade-up overflow-hidden rounded-3xl shadow-token-crimson">
      <div className="relative min-h-[340px] w-full overflow-hidden bg-secondary sm:min-h-[440px]">
        {program.coverImageUrl ? (
          <img
            src={program.coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
        ) : (
          <div className="absolute inset-0 grad-crimson" aria-hidden="true" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(122,12,22,0.45) 50%, rgba(122,12,22,0.96) 100%)",
          }}
        />

        <div className="absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
          <span className="glass-surface-dark inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Featured program
          </span>
        </div>

        {program.categoryName && (
          <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
            <span className="glass-surface rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
              {program.categoryName}
            </span>
          </div>
        )}

        <div className="relative z-10 flex min-h-[340px] flex-col justify-end p-6 sm:min-h-[440px] sm:p-10">
          <h2 className="max-w-3xl text-3xl font-black tracking-[var(--tracking-tight)] text-white sm:text-5xl">
            {title || "Untitled program"}
          </h2>
          {program.tagline && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-lg">{program.tagline}</p>
          )}
          <ProgramStatistics program={program} variant="hero" className="mt-5" />
          <ProgramCtaActions
            program={program}
            variant={ctaMode === "explore" ? "hero-explore" : "hero"}
            className="mt-6"
          />
        </div>
      </div>
    </section>
  );
}
