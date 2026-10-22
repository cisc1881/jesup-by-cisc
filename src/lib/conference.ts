import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { EventDetail } from "./events";

export const FC135 = {
  slug: "fc135",
  title: "135th Annual Farmers Conference",
  theme: "A Legacy in the Soil, A Vision in the Seed",
  location: "Tuskegee University Historic Campus",
  timezone: "America/Chicago",
  startDate: "2027-02-18",
  endDate: "2027-02-19",
} as const;

export const CONFERENCE_SECTIONS = [
  ["home", "Home"], ["schedule", "Schedule"], ["speakers", "Speakers"],
  ["tickets", "Tickets"], ["sponsors", "Sponsors/Exhibitors"], ["map", "Map & Parking"],
  ["resources", "Resources"], ["community", "Community"], ["my-event", "My Event"], ["wallet", "Wallet"],
] as const;
export type ConferenceSection = (typeof CONFERENCE_SECTIONS)[number][0];

export function sectionSettings(metadata: Record<string, unknown>): Record<string, unknown> {
  const value = metadata.sections;
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function visibleConferenceSections(event: EventDetail) {
  const settings = sectionSettings(event.metadata);
  const configured: Record<ConferenceSection, boolean> = {
    home: true,
    schedule: event.sessions.length > 0,
    speakers: event.speakers.length > 0,
    tickets: event.metadata.catalog_enabled === true || event.registrationOpen || Boolean(event.metadata.eventbrite_event_id && safeEventUrl(event.metadata.eventbrite_event_url)),
    sponsors: event.sponsors.length > 0,
    map: Boolean(event.lat != null && event.lng != null || safeEventUrl(event.metadata.parking_url) || safeEventUrl(event.metadata.map_url)),
    resources: event.publications.length > 0 || event.podcasts.length > 0,
    community: event.metadata.community_enabled === true,
    "my-event": event.metadata.attendee_workspace_enabled === true,
    wallet: event.metadata.wallet_enabled === true,
  };
  return CONFERENCE_SECTIONS.filter(([id]) => id === "home" || settings[id] === true && configured[id]);
}

export function safeEventUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : undefined; } catch { return undefined; }
}

export function eventDateLabel(event: { startsAt: string; endsAt: string | null; metadata?: Record<string, unknown> }) {
  const metadata = event.metadata;
  if (metadata?.date_only === true && typeof metadata.start_date === "string" && typeof metadata.end_date === "string") {
    return `${formatInTimeZone(`${metadata.start_date}T12:00:00Z`, "UTC", "MMMM d")}–${formatInTimeZone(`${metadata.end_date}T12:00:00Z`, "UTC", "d, yyyy")}`;
  }
  return formatInTimeZone(event.startsAt, "America/Chicago", "MMM d, yyyy · h:mm a zzz");
}

export function eventLocalInput(iso: string | null, timezone: string) {
  return iso ? formatInTimeZone(iso, timezone, "yyyy-MM-dd'T'HH:mm") : "";
}

export function eventLocalToUtc(value: string, timezone: string) {
  if (!value) return null;
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(value)) return new Date(value).toISOString();
  const result = fromZonedTime(value, timezone);
  if (Number.isNaN(result.getTime())) throw new Error("Enter a valid event date and timezone.");
  if (eventLocalInput(result.toISOString(), timezone) !== value.slice(0, 16)) throw new Error("This local time does not exist in the selected timezone.");
  return result.toISOString();
}

export function conferenceHead(event: EventDetail | null, suffix = "") {
  const title = `${event?.title ?? "Event unavailable"}${suffix} · JESUP by CISC`;
  const description = event ? `${event.metadata.conference_theme ?? event.description ?? event.title}. ${eventDateLabel(event)} · ${event.location ?? "Tuskegee University"}.` : "This JESUP event is not available.";
  const image = safeEventUrl(event?.coverImageUrl);
  return { meta: [
    { title }, { name: "description", content: description }, { property: "og:title", content: title },
    { property: "og:description", content: description }, { property: "og:type", content: "website" },
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
    ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
  ] };
}