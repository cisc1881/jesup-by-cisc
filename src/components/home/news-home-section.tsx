import type { HomeNewsArticle, HomeSectionMeta } from "@/lib/home";
import {
  EmptyState,
  HomeSection,
  HorizontalScroll,
  HorizontalScrollItem,
  SectionActionLink,
} from "@/components/design-system";
import { NewsCard } from "@/components/news";
import { Newspaper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type NewsHomeSectionProps = {
  featured: HomeNewsArticle | null;
  latest: HomeNewsArticle[];
  meta: HomeSectionMeta;
  isLoading?: boolean;
};

export function NewsHomeSection({ featured, latest, meta, isLoading }: NewsHomeSectionProps) {
  const stories = latest.filter((a) => !featured || a.id !== featured.id);

  return (
    <HomeSection sectionId={meta.id} meta={meta}>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-72 shrink-0 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : !featured && stories.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={meta.emptyTitle ?? meta.title}
          description={meta.emptyDescription ?? undefined}
          action={
            meta.viewAllRoute && meta.viewAllLabel ? (
              <SectionActionLink to={meta.viewAllRoute}>{meta.viewAllLabel}</SectionActionLink>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {featured && <NewsCard article={featured} variant="featured" />}
          {stories.length > 0 && (
            <HorizontalScroll gap="sm">
              {stories.map((article) => (
                <HorizontalScrollItem key={article.id} width="lg">
                  <NewsCard article={article} className="w-[85vw] sm:w-full" />
                </HorizontalScrollItem>
              ))}
            </HorizontalScroll>
          )}
        </div>
      )}
    </HomeSection>
  );
}
