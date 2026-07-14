import type { ReactNode } from "react";
import { AppBadge } from "@/components/design-system";
import { cn } from "@/lib/utils";
import { DEMO_WEATHER_LABEL } from "@/lib/weather/mock-data";

type DemoDataLabelProps = {
  className?: string;
};

export function DemoDataLabel({ className }: DemoDataLabelProps) {
  return (
    <AppBadge variant="outline" className={cn("border-dashed text-xs font-medium uppercase tracking-wide", className)}>
      {DEMO_WEATHER_LABEL}
    </AppBadge>
  );
}

type WeatherMetricProps = {
  label: string;
  value: ReactNode;
  className?: string;
};

export function WeatherMetric({ label, value, className }: WeatherMetricProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">{value}</dd>
    </div>
  );
}
