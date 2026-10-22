type RegistrationConfiguration = {
  registrationStatus: string;
  metadata: Record<string, unknown>;
};

/** Organizer confirmation is explicit; an event ID or HTTPS URL alone is not publication. */
export function authorizedEventbriteRegistrationUrl(event: RegistrationConfiguration): string | undefined {
  const metadata = event.metadata;
  if (metadata.registration_provider !== "eventbrite" ||
      !["open", "waiting_list"].includes(event.registrationStatus) ||
      metadata.eventbrite_event_status !== "published" ||
      metadata.eventbrite_registration_authorized !== true ||
      typeof metadata.eventbrite_event_id !== "string" ||
      !/^\d+$/.test(metadata.eventbrite_event_id) ||
      typeof metadata.eventbrite_event_url !== "string") return undefined;
  try {
    const url = new URL(metadata.eventbrite_event_url);
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
        !["www.eventbrite.com", "eventbrite.com"].includes(url.hostname) ||
        !url.pathname.startsWith("/e/") ||
        !new RegExp(`(?:/|-)${metadata.eventbrite_event_id}/?$`).test(url.pathname)) return undefined;
    return url.href;
  } catch { return undefined; }
}