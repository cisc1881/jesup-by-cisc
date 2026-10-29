import { useQuery } from "@tanstack/react-query";
import { MapPin, Navigation } from "lucide-react";
import { productDb } from "@/lib/product-db";

const categoryLabels: Record<string, string> = {
  parking: "Parking",
  building: "Buildings",
  food: "Food",
  registration: "Registration",
  restroom: "Restrooms",
  ada_entrance: "Accessible entrances",
  exhibitor: "Exhibitors",
  emergency: "Emergency points",
  shuttle: "Shuttles",
  first_aid: "First aid",
  session: "Sessions",
  other: "Other locations",
};

export function EventWayfinding({ eventId }: { eventId: string }) {
  const { data: points = [] } = useQuery({
    queryKey: ["event-map-points", eventId],
    queryFn: async () => {
      const { data, error } = await productDb
        .from("event_map_points")
        .select("*")
        .eq("event_id", eventId)
        .eq("is_public", true)
        .order("sort_order")
        .order("label");
      if (error?.code === "PGRST205" || error?.code === "42P01") return [];
      if (error) throw error;
      return data ?? [];
    },
  });
  if (points.length === 0) return null;
  const categories = [...new Set(points.map((point) => point.category))];
  return (
    <section className="space-y-5" aria-labelledby="wayfinding-heading">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Event wayfinding
        </p>
        <h2 id="wayfinding-heading" className="mt-1 text-2xl font-black">
          Find your way
        </h2>
      </div>
      {categories.map((category) => (
        <div key={category} className="rounded-2xl border bg-card p-5">
          <h3 className="text-lg font-bold">{categoryLabels[category] ?? category}</h3>
          <div className="mt-3 divide-y">
            {points
              .filter((point) => point.category === category)
              .map((point) => (
                <div key={point.id} className="flex items-start gap-3 py-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{point.label}</p>
                    {point.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{point.description}</p>
                    )}
                    {(point.building || point.floor_label) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[point.building, point.floor_label].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  {point.latitude !== null && point.longitude !== null && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-1 rounded-xl border px-3 text-xs font-bold"
                    >
                      <Navigation className="h-4 w-4" />
                      Directions
                    </a>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </section>
  );
}
