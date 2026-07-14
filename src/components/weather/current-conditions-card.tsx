import type { CurrentConditions, WeatherLocation } from "@/lib/weather/types";
import { AppCard, AppCardContent, AppCardHeader, AppCardTitle } from "@/components/design-system";
import { MapPin } from "lucide-react";
import { WeatherConditionIcon, formatWeatherTime } from "./weather-icons";
import { WeatherMetric } from "./weather-metric";

type CurrentConditionsCardProps = {
  location: WeatherLocation;
  current: CurrentConditions;
};

export function CurrentConditionsCard({ location, current }: CurrentConditionsCardProps) {
  return (
    <AppCard padding="md" className="h-full">
      <AppCardHeader>
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium text-foreground">{location.label}</p>
            <p>
              {location.county}
              {location.state ? ` · ${location.state}` : ""}
              {location.postalCode ? ` · ${location.postalCode}` : ""}
            </p>
          </div>
        </div>
      </AppCardHeader>
      <AppCardContent>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <WeatherConditionIcon
            code={current.conditionCode}
            label={current.condition}
            className="size-14 shrink-0 text-accent sm:size-16"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{current.condition}</p>
            <p className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              <span className="tabular-nums">{current.temperatureF}</span>
              <span className="text-3xl font-semibold sm:text-4xl">°F</span>
            </p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
          <WeatherMetric label="Feels like" value={`${current.feelsLikeF}°F`} />
          <WeatherMetric label="Humidity" value={`${current.humidityPercent}%`} />
          <WeatherMetric label="Wind" value={`${current.windMph} mph ${current.windDirection}`} />
          <WeatherMetric label="Rain chance" value={`${current.rainChancePercent}%`} />
          <WeatherMetric label="Heat index" value={`${current.heatIndexF}°F`} />
          <WeatherMetric label="Updated" value={formatWeatherTime(current.lastUpdated)} />
        </dl>
      </AppCardContent>
    </AppCard>
  );
}
