import { AppBadge } from "@/components/design-system";
import { cn } from "@/lib/utils";
import type { WeatherCenterStatus } from "@/lib/weather/types";

const STATUS_COPY: Record<
  Exclude<WeatherCenterStatus, "idle" | "loading" | "live">,
  { title: string; message: string; className: string }
> = {
  "requesting-permission": {
    title: "Requesting location permission",
    message: "Approve the browser prompt to use your current location for local weather.",
    className: "border-sky-300/70 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/30",
  },
  "permission-denied": {
    title: "Location permission denied",
    message: "Weather will use your selected or default location. You can enter a city or ZIP instead.",
    className: "border-amber-300/70 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30",
  },
  "provider-error": {
    title: "Weather provider unavailable",
    message: "Some live weather data could not be loaded. Showing fallback information where needed.",
    className: "border-orange-300/70 bg-orange-50/70 dark:border-orange-900 dark:bg-orange-950/30",
  },
  fallback: {
    title: "Using fallback weather data",
    message: "Live providers were unavailable. Demonstration content may be shown until service is restored.",
    className: "border-dashed border-border/80 bg-secondary/30",
  },
};

type WeatherStatusBannerProps = {
  status: WeatherCenterStatus;
  message?: string;
};

export function WeatherStatusBanner({ status, message }: WeatherStatusBannerProps) {
  if (status === "idle" || status === "loading" || status === "live") return null;

  const copy = STATUS_COPY[status];
  if (!copy) return null;

  return (
    <div className={cn("mb-4 rounded-xl border px-4 py-3", copy.className)} role="status">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-foreground">{copy.title}</p>
        {status === "fallback" ? (
          <AppBadge variant="outline" className="border-dashed text-xs uppercase">
            Fallback
          </AppBadge>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{message ?? copy.message}</p>
    </div>
  );
}
