import type { WeatherConditionCode } from "@/lib/weather/types";
import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  ThermometerSun,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CONDITION_ICONS: Record<WeatherConditionCode, LucideIcon> = {
  clear: Sun,
  "partly-cloudy": CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  thunderstorm: CloudLightning,
  wind: Wind,
  hot: ThermometerSun,
};

type WeatherConditionIconProps = {
  code: WeatherConditionCode;
  className?: string;
  label?: string;
};

export function WeatherConditionIcon({ code, className, label }: WeatherConditionIconProps) {
  const Icon = CONDITION_ICONS[code] ?? CloudSun;
  const animated = code === "thunderstorm" || code === "snow";
  return (
    <span
      className={`relative inline-grid place-items-center ${animated ? "weather-condition-animated" : ""}`}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <Icon className={className} aria-hidden="true" />
      {code === "thunderstorm" && (
        <span className="weather-lightning" aria-hidden="true">
          ϟ
        </span>
      )}
      {code === "snow" && (
        <span className="weather-snow" aria-hidden="true">
          <i>•</i>
          <i>•</i>
          <i>•</i>
        </span>
      )}
    </span>
  );
}

export function formatWeatherTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
