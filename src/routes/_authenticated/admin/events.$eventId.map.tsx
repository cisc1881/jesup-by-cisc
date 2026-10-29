import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { productDb } from "@/lib/product-db";

export const Route = createFileRoute("/_authenticated/admin/events/$eventId/map")({
  component: EventMapEditor,
});

const categories = [
  "parking",
  "building",
  "food",
  "registration",
  "restroom",
  "ada_entrance",
  "exhibitor",
  "emergency",
  "shuttle",
  "first_aid",
  "session",
  "other",
];

function EventMapEditor() {
  const { eventId } = Route.useParams();
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("building");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [busy, setBusy] = useState(false);
  const queryKey = ["admin-event-map-points", eventId];
  const { data: points = [], isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await productDb
        .from("event_map_points")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order")
        .order("label");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function addPoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!label.trim() || busy) return;
    const lat = latitude.trim() ? Number(latitude) : null;
    const lng = longitude.trim() ? Number(longitude) : null;
    if (
      (lat === null) !== (lng === null) ||
      (lat !== null && (lat < -90 || lat > 90 || lng! < -180 || lng! > 180))
    ) {
      toast.error("Enter both valid latitude and longitude values, or leave both blank.");
      return;
    }
    setBusy(true);
    const { error } = await productDb.from("event_map_points").insert({
      event_id: eventId,
      label: label.trim(),
      category,
      description: description.trim() || null,
      latitude: lat,
      longitude: lng,
      building: building.trim() || null,
      floor_label: floor.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error("Location could not be saved.");
      return;
    }
    setLabel("");
    setDescription("");
    setLatitude("");
    setLongitude("");
    setBuilding("");
    setFloor("");
    await qc.invalidateQueries({ queryKey });
    await qc.invalidateQueries({ queryKey: ["event-map-points", eventId] });
    toast.success("Location added.");
  }

  async function removePoint(id: string) {
    const { error } = await productDb.from("event_map_points").delete().eq("id", id);
    if (error) toast.error("Location could not be removed.");
    else await qc.invalidateQueries({ queryKey });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7 px-4 py-8 sm:px-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Event operations
        </p>
        <h1 className="mt-2 text-3xl font-black">Map & wayfinding</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Publish real locations for attendees. Building and floor fields allow indoor directions to
          be added later.
        </p>
      </header>
      <form
        onSubmit={(event) => void addPoint(event)}
        className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2"
      >
        <label className="text-sm font-bold">
          Location name
          <input
            required
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          />
        </label>
        <label className="text-sm font-bold">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Description
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          />
        </label>
        <label className="text-sm font-bold">
          Latitude
          <input
            inputMode="decimal"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          />
        </label>
        <label className="text-sm font-bold">
          Longitude
          <input
            inputMode="decimal"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          />
        </label>
        <label className="text-sm font-bold">
          Building
          <input
            value={building}
            onChange={(event) => setBuilding(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          />
        </label>
        <label className="text-sm font-bold">
          Floor
          <input
            value={floor}
            onChange={(event) => setFloor(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3"
          />
        </label>
        <button
          disabled={busy}
          type="submit"
          className="min-h-11 rounded-xl bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50 sm:col-span-2"
        >
          {busy ? "Saving…" : "Add location"}
        </button>
      </form>
      <section aria-label="Event locations" className="space-y-2">
        {isError && (
          <p role="alert" className="text-destructive">
            Locations could not be loaded. Apply the product migration if needed.
          </p>
        )}
        {points.length === 0 && !isError && (
          <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            No locations published for this event.
          </p>
        )}
        {points.map((point) => (
          <div key={point.id} className="flex items-center gap-4 rounded-xl border bg-card p-4">
            <div className="flex-1">
              <p className="font-bold">{point.label}</p>
              <p className="text-xs text-muted-foreground">
                {point.category.replaceAll("_", " ")}
                {point.building ? ` · ${point.building}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void removePoint(point.id)}
              className="min-h-11 rounded-lg border px-4 text-sm font-bold"
            >
              Remove
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
