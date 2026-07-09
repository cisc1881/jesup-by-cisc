import { PARTNER_IMPACT_GROUPS } from "@/lib/partner-categories";
import type { PartnerImpactCounts } from "@/lib/partners";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PartnerImpactStatsProps = {
  counts: PartnerImpactCounts;
  className?: string;
};

export function PartnerImpactStats({ counts, className }: PartnerImpactStatsProps) {
  return (
    <section className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)} aria-label="Partnership impact">
      {PARTNER_IMPACT_GROUPS.map((group) => (
        <Card key={group.id} className="border-0 shadow-token-soft">
          <CardContent className="p-5 text-center">
            <div className="font-serif text-3xl font-bold text-primary">
              {(counts[group.id] ?? 0).toLocaleString()}
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {group.label}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
