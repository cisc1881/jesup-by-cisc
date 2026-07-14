import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import type { ProgramListItem } from "@/lib/programs";
import { AppBadge, AppCard } from "@/components/design-system";
import { ProgramCtaActions } from "@/components/programs/program-cta-actions";
import { ProgramStatistics } from "@/components/programs/program-statistics";
import { cn } from "@/lib/utils";

type ProgramCardProps = {
  program: ProgramListItem;
  className?: string;
  variant?: "portrait" | "compact" | "small" | "rich";
  /** Stagger index for enter animation in carousels */
  animationIndex?: number;
};

function ProgramImage({
  program,
  aspectClass,
  overlay = false,
}: {
  program: ProgramListItem;
  aspectClass: string;
  overlay?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-secondary", aspectClass)}>
      {program.coverImageUrl ? (
        <img src={program.coverImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-full w-full grad-crimson" aria-hidden="true" />
      )}
      {overlay && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 55%, rgba(122,12,22,0.88) 100%)",
          }}
        />
      )}
    </div>
  );
}

function ProgramCardBody({
  program,
  compact,
  small,
}: {
  program: ProgramListItem;
  compact?: boolean;
  small?: boolean;
}) {
  const title = program.short ? `${program.short} ${program.name}`.trim() : program.name;
  const isSmall = small || compact;

  return (
    <>
      <ProgramImage
        program={program}
        aspectClass={small ? "aspect-[16/9]" : compact ? "aspect-[16/9]" : "aspect-[16/10]"}
      />

      <div className={cn("flex flex-1 flex-col", small ? "p-3" : "p-4 sm:p-5")}>
        <h3
          className={cn(
            "font-black tracking-[var(--tracking-tight)] text-foreground",
            small ? "text-base" : compact ? "text-base" : "text-xl",
          )}
        >
          {title || "Untitled program"}
        </h3>

        {program.categoryName && (
          <AppBadge variant="gold" className={cn("w-fit", small ? "mt-1.5 text-[10px]" : "mt-2")}>
            {program.categoryName}
          </AppBadge>
        )}

        {program.tagline && (
          <p
            className={cn(
              "leading-relaxed text-muted-foreground",
              small ? "mt-2 line-clamp-2 text-xs" : "mt-3 line-clamp-3 text-sm",
            )}
          >
            {program.tagline}
          </p>
        )}

        <ProgramStatistics
          program={program}
          variant={small ? "compact" : "card"}
          className={small ? "mt-2" : "mt-4"}
        />

        {!isSmall && (
          <div className="mt-auto pt-5">
            <ProgramCtaActions program={program} variant="card" />
          </div>
        )}
      </div>
    </>
  );
}

function RichProgramCardBody({ program }: { program: ProgramListItem }) {
  const title = program.short ? `${program.short} ${program.name}`.trim() : program.name;

  return (
    <>
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
        {program.coverImageUrl ? (
          <img
            src={program.coverImageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full grad-crimson" aria-hidden="true" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.25) 40%, rgba(122,12,22,0.92) 100%)",
          }}
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          {program.categoryName && (
            <span className="glass-surface rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              {program.categoryName}
            </span>
          )}
          {program.isFeatured && (
            <span className="glass-surface inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              <Sparkles className="h-3 w-3 text-accent" aria-hidden="true" />
              Featured
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="line-clamp-2 text-lg font-black tracking-[var(--tracking-tight)] text-white">
            {title || "Untitled program"}
          </h3>
          <ProgramStatistics program={program} variant="rich" className="mt-2" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {program.tagline && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{program.tagline}</p>
        )}
        <div className="mt-auto pt-4">
          <ProgramCtaActions program={program} variant="card" />
        </div>
      </div>
    </>
  );
}

export function ProgramCard({ program, className, variant = "portrait", animationIndex = 0 }: ProgramCardProps) {
  const compact = variant === "compact";
  const small = variant === "small";
  const rich = variant === "rich";

  const animationStyle = rich
    ? { animationDelay: `${animationIndex * 90}ms` }
    : undefined;

  if (compact) {
    return program.slug ? (
      <Link
        to="/programs/$slug"
        params={{ slug: program.slug }}
        className={cn(
          "group flex gap-4 overflow-hidden rounded-2xl bg-card p-3 shadow-token-soft transition hover:shadow-token-lift sm:p-4",
          className,
        )}
      >
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-24 sm:w-24">
          {program.coverImageUrl ? (
            <img src={program.coverImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full grad-crimson" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {program.categoryName && (
            <AppBadge variant="gold" className="mb-1.5">
              {program.categoryName}
            </AppBadge>
          )}
          <h3 className="line-clamp-2 font-bold text-foreground">
            {program.short ? `${program.short} ${program.name}`.trim() : program.name}
          </h3>
          {program.tagline && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{program.tagline}</p>
          )}
        </div>
        <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
    ) : (
      <div
        className={cn(
          "flex gap-4 overflow-hidden rounded-2xl bg-card p-3 opacity-60 shadow-token-soft sm:p-4",
          className,
        )}
      >
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-24 sm:w-24">
          {program.coverImageUrl ? (
            <img src={program.coverImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full grad-crimson" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-bold text-foreground">
            {program.short ? `${program.short} ${program.name}`.trim() : program.name || "Untitled program"}
          </h3>
        </div>
      </div>
    );
  }

  const card = (
    <AppCard
      variant="lift"
      padding="none"
      className={cn(
        "flex h-full flex-col overflow-hidden",
        rich &&
          "group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-token-lift active:scale-[0.98] animate-fade-up",
        className,
      )}
      style={animationStyle}
    >
      {rich ? <RichProgramCardBody program={program} /> : <ProgramCardBody program={program} compact={compact} small={small} />}
    </AppCard>
  );

  if (!program.slug) {
    return <div className="opacity-60">{card}</div>;
  }

  return (
    <Link to="/programs/$slug" params={{ slug: program.slug }} className="block h-full">
      {card}
    </Link>
  );
}
