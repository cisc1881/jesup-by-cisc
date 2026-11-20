import { Link } from "@tanstack/react-router";
import { CloudSun } from "lucide-react";
import { useWeatherData } from "@/hooks/use-weather-data";
import { useWeatherLocation } from "@/hooks/use-weather-location";
import { WeatherConditionIcon } from "./weather-icons";

export function HeaderWeather() {
  const { location, status } = useWeatherLocation();
  const { data, isError } = useWeatherData({
    location,
    enabled: status !== "requesting-permission",
  });
  const current = data && !isError && !data.isDemo && !data.isFallback ? data.current : null;
  const locationLabel = current
    ? (data?.location.label ?? location.label ?? "your area")
    : (location.label ?? data?.location.label ?? "your area");
  const shortLocation = locationLabel.split(",")[0]?.trim() || "Local";

  return (
    <Link
      to="/weather"
      aria-label={
        current
          ? `Weather in ${locationLabel}: ${current.temperatureF} degrees. Open weather center`
          : `Open weather for ${locationLabel}`
      }
      className="inline-flex min-h-11 max-w-[6.25rem] shrink-0 items-center justify-center gap-1 rounded-full border border-primary/45 bg-primary/10 px-1.5 text-xs font-bold text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-[375px]:max-w-[7.5rem] min-[375px]:px-2.5 sm:max-w-none"
    >
      {current ? (
        <WeatherConditionIcon code={current.conditionCode} className="h-4 w-4" />
      ) : (
        <CloudSun className="h-4 w-4" aria-hidden="true" />
      )}
      <span
        aria-hidden="true"
        className="flex min-w-0 flex-col leading-tight sm:flex-row sm:items-center sm:gap-1.5"
      >
        <span className="max-w-[5rem] truncate text-[10px] sm:hidden">{shortLocation}</span>
        <span className="hidden max-w-[9rem] truncate sm:inline">{locationLabel}</span>
        <span className="tabular-nums">{current ? `${current.temperatureF}°` : "Weather"}</span>
      </span>
    </Link>
  );
}
