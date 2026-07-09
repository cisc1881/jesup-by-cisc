import { Link } from "@tanstack/react-router";
import type { HomePartner, HomeSectionMeta } from "@/lib/home";
import {
  EmptyState,
  HomeSection,
  HorizontalScroll,
  HorizontalScrollItem,
  SectionActionLink,
} from "@/components/design-system";
import { Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type StrategicPartnersHomeSectionProps = {
  partners: HomePartner[];
  meta: HomeSectionMeta;
  isLoading?: boolean;
};

export function StrategicPartnersHomeSection({
  partners,
  meta,
  isLoading,
}: StrategicPartnersHomeSectionProps) {
  return (
    <HomeSection sectionId={meta.id} meta={meta}>
      {isLoading ? (
        <HorizontalScroll>
          {Array.from({ length: 4 }).map((_, i) => (
            <HorizontalScrollItem key={i}>
              <Skeleton className="h-28 w-40 rounded-2xl" />
            </HorizontalScrollItem>
          ))}
        </HorizontalScroll>
      ) : partners.length === 0 ? (
        <EmptyState
          icon={Building2}
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
          {partners.map((partner) => (
            <HorizontalScrollItem key={partner.slug}>
              <Link
                to="/partners/$slug"
                params={{ slug: partner.slug }}
                className="flex h-28 w-40 flex-col items-center justify-center rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-token-soft transition hover:-translate-y-0.5 hover:shadow-token-lift sm:w-44"
              >
                {partner.logoUrl ? (
                  <img
                    src={partner.logoUrl}
                    alt=""
                    className="max-h-14 max-w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-center text-xs font-bold text-muted-foreground line-clamp-3">
                    {partner.name}
                  </span>
                )}
              </Link>
            </HorizontalScrollItem>
          ))}
        </HorizontalScroll>
      )}
    </HomeSection>
  );
}
