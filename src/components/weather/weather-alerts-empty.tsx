import { CheckCircle2 } from "lucide-react";
import { AppCard } from "@/components/design-system";

export function WeatherAlertsEmptyState() {
  return (
    <AppCard padding="md" className="mb-6 border-emerald-300/50 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
        <div>
          <h3 className="text-base font-semibold text-foreground">No active alerts</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The National Weather Service reports no active alerts for this location right now.
            Continue monitoring trusted local sources during severe weather.
          </p>
        </div>
      </div>
    </AppCard>
  );
}
