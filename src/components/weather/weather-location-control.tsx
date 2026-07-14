import { useState } from "react";
import type { LocationSource } from "@/lib/weather/types";
import { AppBadge, AppButton } from "@/components/design-system";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GEOCODE_MIN_QUERY_LENGTH } from "@/lib/weather/constants";
import { MapPin, Navigation, Search } from "lucide-react";

const SOURCE_LABELS: Record<LocationSource, string> = {
  live: "Live location",
  manual: "Manually selected",
  default: "Default fallback",
};

type WeatherLocationControlProps = {
  locationSource: LocationSource;
  locationLabel?: string;
  county?: string;
  isEditing: boolean;
  isSearching?: boolean;
  onRequestLocation: () => void;
  onSearchLocation: (query: string) => Promise<void>;
  onUseDefault: () => void;
  onOpenEditor: () => void;
  onCloseEditor: () => void;
};

export function WeatherLocationControl({
  locationSource,
  locationLabel,
  county,
  isEditing,
  isSearching,
  onRequestLocation,
  onSearchLocation,
  onUseDefault,
  onOpenEditor,
  onCloseEditor,
}: WeatherLocationControlProps) {
  const [query, setQuery] = useState("");

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < GEOCODE_MIN_QUERY_LENGTH) return;
    await onSearchLocation(trimmed);
  }

  return (
    <div className="mb-4 rounded-2xl border border-border/60 bg-secondary/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <MapPin className="size-4 text-accent" aria-hidden="true" />
        <AppBadge variant="secondary">{SOURCE_LABELS[locationSource]}</AppBadge>
        {locationLabel ? (
          <span className="text-sm font-medium text-foreground">{locationLabel}</span>
        ) : null}
        {county ? <span className="text-sm text-muted-foreground">· {county}</span> : null}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Location is optional and requested only when you choose. JESUP does not continuously track
        your position. Coordinates are not stored in our database — only your selected preference may
        be saved in this browser.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <AppButton
          type="button"
          size="sm"
          className="min-h-11"
          onClick={onRequestLocation}
        >
          <Navigation aria-hidden="true" />
          Use my location
        </AppButton>
        <AppButton type="button" size="sm" variant="outline" className="min-h-11" onClick={onOpenEditor}>
          Change location
        </AppButton>
        {locationSource !== "default" ? (
          <AppButton type="button" size="sm" variant="ghost" className="min-h-11" onClick={onUseDefault}>
            Use Macon County default
          </AppButton>
        ) : null}
      </div>

      {isEditing ? (
        <form className="mt-4 space-y-3" onSubmit={handleSearch}>
          <div className="space-y-1.5">
            <Label htmlFor="weather-location-search">City or ZIP</Label>
            <Input
              id="weather-location-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. Tuskegee, AL or 36083"
              autoComplete="postal-code"
              minLength={GEOCODE_MIN_QUERY_LENGTH}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <AppButton type="submit" size="sm" className="min-h-11" disabled={isSearching || query.trim().length < GEOCODE_MIN_QUERY_LENGTH}>
              <Search aria-hidden="true" />
              {isSearching ? "Searching…" : "Search location"}
            </AppButton>
            <AppButton type="button" size="sm" variant="ghost" className="min-h-11" onClick={onCloseEditor}>
              Cancel
            </AppButton>
          </div>
        </form>
      ) : null}
    </div>
  );
}
