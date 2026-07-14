import type { HomePublication, HomeSectionMeta } from "@/lib/home";
import {
  EmptyState,
  HomeSection,
  HorizontalScroll,
  HorizontalScrollItem,
  SectionActionLink,
} from "@/components/design-system";
import { PublicationCard } from "@/components/publications";
import { BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type LatestPublicationsSectionProps = {
  publications: HomePublication[];
  meta: HomeSectionMeta;
  isLoading?: boolean;
};

export function LatestPublicationsSection({ publications, meta, isLoading }: LatestPublicationsSectionProps) {
  return (
    <HomeSection sectionId={meta.id} meta={meta}>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : publications.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={meta.emptyTitle ?? meta.title}
          description={meta.emptyDescription ?? undefined}
          action={
            meta.viewAllRoute && meta.viewAllLabel ? (
              <SectionActionLink to={meta.viewAllRoute}>{meta.viewAllLabel}</SectionActionLink>
            ) : undefined
          }
        />
      ) : (
        <HorizontalScroll gap="sm">
          {publications.map((p) => (
            <HorizontalScrollItem key={p.id} width="lg">
              <PublicationCard publication={p} className="w-[85vw] sm:w-full" />
            </HorizontalScrollItem>
          ))}
        </HorizontalScroll>
      )}
    </HomeSection>
  );
}
