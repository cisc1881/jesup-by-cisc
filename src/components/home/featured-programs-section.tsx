import { Link } from "@tanstack/react-router";
import type { HomeProgram, HomeSectionMeta } from "@/lib/home";
import {
  EmptyState,
  HomeSection,
  HorizontalScroll,
  HorizontalScrollItem,
  PortraitMediaCard,
  SectionActionLink,
} from "@/components/design-system";
import { LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type FeaturedProgramsSectionProps = {
  programs: HomeProgram[];
  meta: HomeSectionMeta;
  isLoading?: boolean;
};

export function FeaturedProgramsSection({ programs, meta, isLoading }: FeaturedProgramsSectionProps) {
  return (
    <HomeSection sectionId={meta.id} meta={meta}>
      {isLoading ? (
        <HorizontalScroll>
          {Array.from({ length: 3 }).map((_, i) => (
            <HorizontalScrollItem key={i}>
              <Skeleton className="aspect-[4/5] w-[75vw] rounded-2xl sm:w-64" />
            </HorizontalScrollItem>
          ))}
        </HorizontalScroll>
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
        <HorizontalScroll>
          {programs.map((p) => (
            <HorizontalScrollItem key={p.slug}>
              <Link to="/programs/$slug" params={{ slug: p.slug }}>
                <PortraitMediaCard
                  imageUrl={p.imageUrl}
                  imageAlt={p.name}
                  eyebrow={p.categoryName}
                  title={p.short}
                  description={p.tagline}
                />
              </Link>
            </HorizontalScrollItem>
          ))}
        </HorizontalScroll>
      )}
    </HomeSection>
  );
}
