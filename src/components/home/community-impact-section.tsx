import type { HomeImpactStat, HomeSectionMeta } from "@/lib/home";
import { CrimsonPanel, SectionHeader, StatGrid } from "@/components/design-system";
import { Skeleton } from "@/components/ui/skeleton";

type CommunityImpactSectionProps = {
  stats: HomeImpactStat[];
  meta: HomeSectionMeta;
  isLoading?: boolean;
};

export function CommunityImpactSection({ stats, meta, isLoading }: CommunityImpactSectionProps) {
  const headingId = `home-${meta.id}-heading`;

  return (
    <section aria-labelledby={headingId}>
      <CrimsonPanel className="px-4 py-8 sm:px-8 sm:py-10">
        <SectionHeader
          titleId={headingId}
          eyebrow={meta.eyebrow ?? undefined}
          title={meta.title}
          titleClassName="text-primary-foreground"
        />
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : (
          <StatGrid stats={stats} />
        )}
      </CrimsonPanel>
    </section>
  );
}
