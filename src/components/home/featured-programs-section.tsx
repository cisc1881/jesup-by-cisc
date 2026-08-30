import { Link } from "@tanstack/react-router";
import type { HomeProgram, HomeSectionMeta } from "@/lib/home";
import { EmptyState, HomeSection, SectionActionLink } from "@/components/design-system";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type FeaturedProgramsSectionProps = {
  programs: HomeProgram[];
  meta: HomeSectionMeta;
  isLoading?: boolean;
};

export function FeaturedProgramsSection({
  programs,
  meta,
  isLoading,
}: FeaturedProgramsSectionProps) {
  return (
    <HomeSection sectionId={meta.id} meta={meta}>
      {isLoading ? (
        <div className="grid gap-px bg-border sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title={meta.emptyTitle ?? meta.title}
          description={meta.emptyDescription ?? undefined}
          action={
            meta.viewAllRoute && meta.viewAllLabel ? (
              <SectionActionLink to={meta.viewAllRoute}>{meta.viewAllLabel}</SectionActionLink>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-px border bg-border sm:grid-cols-2">
          {programs.slice(0, 6).map((p) => (
            <Link
              key={p.slug}
              to="/programs/$slug"
              params={{ slug: p.slug }}
              className="grid min-h-28 grid-cols-[84px_minmax(0,1fr)_20px] items-center gap-4 bg-card p-4 hover:bg-muted/50"
            >
              {p.imageUrl ? (
                <img src={p.imageUrl} alt="" className="h-20 w-20 object-cover" loading="lazy" />
              ) : (
                <span className="grid h-20 w-20 place-items-center institution-surface-secondary">
                  <LayoutGrid className="h-6 w-6 institution-accent-text" />
                </span>
              )}
              <span className="min-w-0">
                {p.categoryName && (
                  <span className="text-[10px] font-bold uppercase tracking-wider institution-accent-text">
                    {p.categoryName}
                  </span>
                )}
                <span className="mt-1 block line-clamp-2 font-black">{p.short}</span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {p.tagline}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </HomeSection>
  );
}
