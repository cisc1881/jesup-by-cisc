import { useState } from "react";
import type { SevereWeatherAlert, WeatherSeverity } from "@/lib/weather/types";
import { AppBadge } from "@/components/design-system";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { DemoDataLabel } from "./weather-metric";
import { formatWeatherTime } from "./weather-icons";

const LIVE_DATA_LABEL = "Live NWS data";

const SEVERITY_STYLES: Record<
  WeatherSeverity,
  { badge: string; panel: string; label: string }
> = {
  advisory: {
    label: "Advisory",
    badge: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-800",
    panel: "border-sky-300/80 bg-sky-50/80 dark:border-sky-800 dark:bg-sky-950/40",
  },
  watch: {
    label: "Watch",
    badge: "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800",
    panel: "border-amber-300/80 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/40",
  },
  warning: {
    label: "Warning",
    badge: "bg-orange-100 text-orange-950 border-orange-300 dark:bg-orange-950 dark:text-orange-100 dark:border-orange-800",
    panel: "border-orange-400/80 bg-orange-50/80 dark:border-orange-900 dark:bg-orange-950/40",
  },
  emergency: {
    label: "Emergency",
    badge: "bg-destructive/15 text-destructive border-destructive/40",
    panel: "border-destructive/50 bg-destructive/10",
  },
};

type SevereAlertBannerProps = {
  alert: SevereWeatherAlert;
  showDemoLabel?: boolean;
};

export function SevereAlertBanner({ alert, showDemoLabel }: SevereAlertBannerProps) {
  const [open, setOpen] = useState(false);
  const styles = SEVERITY_STYLES[alert.severity];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn("rounded-2xl border p-4 sm:p-5 motion-safe:transition-colors", styles.panel)}
        role="region"
        aria-labelledby={`alert-${alert.id}-title`}
      >
        <div className="flex flex-wrap items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <AppBadge className={cn("border font-semibold", styles.badge)}>
                {styles.label}
              </AppBadge>
              {showDemoLabel ? <DemoDataLabel /> : (
                <AppBadge variant="secondary" className="text-xs font-medium uppercase tracking-wide">
                  {LIVE_DATA_LABEL}
                </AppBadge>
              )}
            </div>
            <h3 id={`alert-${alert.id}-title`} className="text-base font-bold text-foreground sm:text-lg">
              {alert.title}
            </h3>
            {alert.source ? (
              <p className="text-xs text-muted-foreground">Source: {alert.source}</p>
            ) : null}
            <p className="text-sm text-foreground/90">{alert.shortDescription}</p>
            <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <div>
                <dt className="inline font-medium">Effective: </dt>
                <dd className="inline">{formatWeatherTime(alert.effectiveAt)}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Expires: </dt>
                <dd className="inline">{formatWeatherTime(alert.expiresAt)}</dd>
              </div>
            </dl>
            <p className="text-sm font-medium text-foreground">
              <span className="font-semibold">Recommended: </span>
              {alert.recommendedAction}
            </p>
          </div>
        </div>
        <CollapsibleTrigger
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={open}
        >
          {open ? "Hide details" : "View alert details"}
          <ChevronDown
            className={cn("size-4 motion-safe:transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {alert.details}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
