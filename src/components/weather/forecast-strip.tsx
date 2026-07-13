import type { ForecastDay } from "@/lib/weather/types";
import { AppCard, HorizontalScroll, HorizontalScrollItem } from "@/components/design-system";
import { cn } from "@/lib/utils";
import { Droplets } from "lucide-react";
import { WeatherConditionIcon } from "./weather-icons";

type ForecastStripProps = {
  days: ForecastDay[];
};

function ForecastDayCard({ day }: { day: ForecastDay }) {
  return (
    <AppCard padding="sm" className="flex h-full min-w-[5.5rem] flex-col items-center gap-2 text-center sm:min-w-0">
      <p className="text-sm font-semibold text-foreground">{day.weekday}</p>
      <WeatherConditionIcon code={day.conditionCode} label={day.condition} className="size-8 text-accent" />
      <p className="sr-only">{day.condition}</p>
      <div className="flex items-baseline gap-1.5 text-sm tabular-nums">
        <span className="font-bold text-foreground">{day.highF}°</span>
        <span className="text-muted-foreground">{day.lowF}°</span>
      </div>
      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Droplets className="size-3.5" aria-hidden="true" />
        <span>{day.rainProbabilityPercent}%</span>
        <span className="sr-only">rain probability</span>
      </p>
    </AppCard>
  );
}

export function ForecastStrip({ days }: ForecastStripProps) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">7-day forecast</h3>
      {/* Mobile: horizontal scroll */}
      <div className="lg:hidden">
        <HorizontalScroll aria-label="Seven day forecast">
          {days.map((day) => (
            <HorizontalScrollItem key={day.weekday} width="sm">
              <ForecastDayCard day={day} />
            </HorizontalScrollItem>
          ))}
        </HorizontalScroll>
      </div>
      {/* Desktop: full grid */}
      <div
        className={cn("hidden gap-3 lg:grid", days.length === 7 ? "grid-cols-7" : "grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))]")}
        role="list"
        aria-label="Seven day forecast"
      >
        {days.map((day) => (
          <div key={day.weekday} role="listitem">
            <ForecastDayCard day={day} />
          </div>
        ))}
      </div>
    </div>
  );
}
