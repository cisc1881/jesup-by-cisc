import type { EventListItem } from "@/lib/events";
import { googleMapsDirectionsUrl } from "@/lib/event-calendar";
import { AppButton } from "@/components/design-system";
import { cn } from "@/lib/utils";
import { ExternalLink, MapPin } from "lucide-react";

type EventMapViewProps = {
  events: EventListItem[];
  className?: string;
};

export function EventMapView({ events, className }: EventMapViewProps) {
  const mapped = events.filter((event) => event.lat != null && event.lng != null);

  return (
    <div className={cn("space-y-4", className)}>
      {mapped.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card px-6 py-12 text-center shadow-token-soft">
          <MapPin className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">No mapped event locations yet. Add coordinates in the admin editor.</p>
        </div>
      ) : (
        mapped.map((event) => (
          <div key={event.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-token-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-foreground">{event.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{event.location ?? event.locationAddress}</p>
              </div>
              <AppButton variant="outline" size="sm" shape="pill" asChild>
                <a href={googleMapsDirectionsUrl(event)} target="_blank" rel="noreferrer">
                  Directions <ExternalLink className="h-4 w-4" />
                </a>
              </AppButton>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-border/50">
              <iframe
                title={`Map for ${event.title}`}
                className="h-56 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${event.lat},${event.lng}&z=14&output=embed`}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
