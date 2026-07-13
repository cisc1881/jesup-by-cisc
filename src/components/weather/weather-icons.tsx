import type { WeatherConditionCode } from "@/lib/weather/types";
import {
  Cloud,
  CloudLightning,
  CloudRain,
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
  thunderstorm: CloudLightning,
  wind: Wind,
  hot: ThermometerSun,
};

type WeatherConditionIconProps = {
  code: WeatherConditionCode;
  className?: string;
  label?: string;
};

export function WeatherConditionIcon({ code, className }: WeatherConditionIconProps) {
  const Icon = CONDITION_ICONS[code] ?? CloudSun;
  return <Icon className={className} aria-hidden="true" />;
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
