import type { EventDetail, EventListItem } from "@/lib/events";

function escapeIcs(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\r", "");
}

function formatIcsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildEventIcs(event: Pick<EventListItem, "title" | "description" | "startsAt" | "endsAt" | "location" | "id" | "metadata">) {
  const end = event.endsAt ?? new Date(new Date(event.startsAt).getTime() + 2 * 60 * 60 * 1000).toISOString();
  const description = escapeIcs(event.description ?? "");
  const location = event.location ?? "CISC · Tuskegee University";
  const metadata = event.metadata;
  const dateOnly = metadata?.date_only === true && typeof metadata.start_date === "string" && typeof metadata.end_date === "string";
  const endDate = dateOnly ? new Date(`${String(metadata.end_date)}T00:00:00Z`) : null;
  if (endDate) endDate.setUTCDate(endDate.getUTCDate() + 1);
  const dates = dateOnly && endDate ? [
    `DTSTART;VALUE=DATE:${String(metadata.start_date).replaceAll("-", "")}`,
    `DTEND;VALUE=DATE:${endDate.toISOString().slice(0,10).replaceAll("-", "")}`,
  ] : [`DTSTART:${formatIcsDate(event.startsAt)}`, `DTEND:${formatIcsDate(end)}`];

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JESUP//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:event-${event.id}@jesup.cisc`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    ...dates,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${escapeIcs(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadEventIcs(event: EventDetail | EventListItem) {
  const blob = new Blob([buildEventIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${event.slug || event.id}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function googleMapsDirectionsUrl(event: Pick<EventListItem, "lat" | "lng" | "locationAddress" | "location">) {
  if (event.lat != null && event.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}`;
  }
  const query = encodeURIComponent(event.locationAddress || event.location || "");
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

export async function shareEvent(event: Pick<EventListItem, "title" | "id" | "slug">) {
  const url = `${window.location.origin}/events/${event.id}`;
  if (navigator.share) {
    await navigator.share({ title: event.title, text: `Join us at ${event.title}`, url });
    return;
  }
  await navigator.clipboard.writeText(url);
}
