import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { EventDetail } from "./events";
import { authorizedEventbriteRegistrationUrl } from "./eventbrite-registration";

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

export function conferenceResourceLinks(metadata: Record<string, unknown>) {
  if (!Array.isArray(metadata.resource_links)) return [];
  return metadata.resource_links.flatMap((item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = item as Record<string, unknown>;
    const url = safeEventUrl(row.url);
    return typeof row.label === "string" && row.label.trim() && url ? [{ label: row.label.trim(), url }] : [];
  });
}

export function visibleConferenceSections(event: EventDetail, activeProductCount = 0) {
  const settings = sectionSettings(event.metadata);
  const configured: Record<ConferenceSection, boolean> = {
    home: true,
    schedule: event.sessions.length > 0,
    speakers: event.speakers.length > 0,
    tickets: event.metadata.catalog_enabled === true && activeProductCount > 0 || (event.metadata.registration_provider !== "eventbrite" && event.registrationOpen) || Boolean(authorizedEventbriteRegistrationUrl(event)),
    sponsors: event.sponsors.length > 0,
    map: Boolean(event.lat != null && event.lng != null || safeEventUrl(event.metadata.parking_url) || safeEventUrl(event.metadata.map_url)),
    resources: event.publications.length > 0 || event.podcasts.length > 0 || conferenceResourceLinks(event.metadata).length > 0,
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

export function eventDateLabel(event: { startsAt: string; endsAt: string | null; timezone?: string | null; metadata?: Record<string, unknown> }) {
  const metadata = event.metadata;
  if (metadata?.date_only === true && typeof metadata.start_date === "string" && typeof metadata.end_date === "string") {
    return `${formatInTimeZone(`${metadata.start_date}T12:00:00Z`, "UTC", "MMMM d")}–${formatInTimeZone(`${metadata.end_date}T12:00:00Z`, "UTC", "d, yyyy")}`;
  }
  const timezone = event.timezone || (typeof metadata?.event_timezone === "string" ? metadata.event_timezone : "America/Chicago");
  return formatInTimeZone(event.startsAt, timezone, "MMM d, yyyy · h:mm a zzz");
}

/** Inclusive display dates become an exclusive midnight end in the event timezone. */
export function conferenceDateRange(start: string, end: string, timezone: string) {
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  if (!validDate(start) || !validDate(end) || end < start) throw new Error("Enter valid conference dates, with the last date on or after the first.");
  const following = new Date(`${end}T00:00:00Z`);
  following.setUTCDate(following.getUTCDate() + 1);
  return { startsAt: eventLocalToUtc(`${start}T00:00`, timezone), endsAt: eventLocalToUtc(`${following.toISOString().slice(0, 10)}T00:00`, timezone) };
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