import type { AgriculturalInsights } from "@/lib/weather/types";
import { AppBadge, AppCard, AppCardContent, AppCardHeader, AppCardTitle } from "@/components/design-system";
import { DemoDataLabel } from "./weather-metric";
import { Sprout } from "lucide-react";

type AgriculturalInsightsCardProps = {
  insights: AgriculturalInsights;
  showDemoLabel?: boolean;
};

export function AgriculturalInsightsCard({ insights, showDemoLabel }: AgriculturalInsightsCardProps) {
  return (
    <AppCard padding="md" className="h-full">
      <AppCardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Sprout className="size-5 text-accent" aria-hidden="true" />
          <AppCardTitle>{insights.title}</AppCardTitle>
          {showDemoLabel ? <DemoDataLabel /> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Demonstration insights until live Extension and USDA data sources are connected.
        </p>
      </AppCardHeader>
      <AppCardContent className="space-y-4">
        <ul className="space-y-3">
          {insights.insights.map((item) => (
            <li key={item.id} className="rounded-xl border border-border/60 bg-secondary/30 px-3 py-2.5">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{item.summary}</p>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <AppBadge variant="secondary">
            USDA deadlines (demo): {insights.usdaDeadlineCount}
          </AppBadge>
          <AppBadge variant="secondary">
            Extension workshops (demo): {insights.extensionWorkshopCount}
          </AppBadge>
        </div>
      </AppCardContent>
    </AppCard>
  );
}
