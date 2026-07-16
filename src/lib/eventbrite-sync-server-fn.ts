import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type EventbriteAttendee = {
  id: string;
  status?: string;
  profile?: { name?: string; first_name?: string; last_name?: string; email?: string };
  barcodes?: Array<{ barcode?: string; status?: string }>;
};

type EventbriteAttendeePage = {
  attendees?: EventbriteAttendee[];
  pagination?: { page_number?: number; page_count?: number; has_more_items?: boolean };
};

async function listEventbriteAttendees(eventbriteEventId: string, token: string) {
  const attendees: EventbriteAttendee[] = [];
  let page = 1;

  while (page <= 100) {
    const url = new URL(`https://www.eventbriteapi.com/v3/events/${encodeURIComponent(eventbriteEventId)}/attendees/`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("page_size", "100");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Eventbrite attendee request failed (${response.status}).`);
    }
    const payload = (await response.json()) as EventbriteAttendeePage;
    attendees.push(...(payload.attendees ?? []));
    if (!payload.pagination?.has_more_items && page >= (payload.pagination?.page_count ?? page)) break;
    page += 1;
  }

  return attendees;
}

export const syncEventbriteRegistrationsServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError) throw roleError;
    if (!role) throw new Error("Forbidden: admin role required.");

    const token = process.env.EVENTBRITE_PRIVATE_TOKEN?.trim();
    if (!token) throw new Error("EVENTBRITE_PRIVATE_TOKEN is not configured.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: events, error: eventsError } = await supabaseAdmin
      .from("events")
      .select("id, title, metadata")
      .eq("is_active", true);
    if (eventsError) throw eventsError;

    let imported = 0;
    let updated = 0;
    let linkedEvents = 0;

    for (const event of events ?? []) {
      const metadata = (event.metadata ?? {}) as Record<string, unknown>;
      if (metadata.registration_provider !== "eventbrite") continue;
      const externalEventId = String(metadata.eventbrite_event_id ?? "").trim();
      if (!externalEventId) continue;
      linkedEvents += 1;

      const attendees = await listEventbriteAttendees(externalEventId, token);
      for (const attendee of attendees) {
        const attendeeName = attendee.profile?.name?.trim() ||
          [attendee.profile?.first_name, attendee.profile?.last_name].filter(Boolean).join(" ").trim() ||
          "Eventbrite attendee";
        const barcode = attendee.barcodes?.find((item) => item.barcode)?.barcode?.trim() ?? null;
        const isCancelled = (attendee.status ?? "").toLowerCase().includes("cancel");

        const { data: existing, error: existingError } = await supabaseAdmin
          .from("event_registrations")
          .select("id")
          .eq("registration_source", "eventbrite")
          .eq("external_registration_id", attendee.id)
          .maybeSingle();
        if (existingError) throw existingError;

        const record = {
          event_id: event.id,
          user_id: null,
          attendee_name: attendeeName,
          attendee_email: attendee.profile?.email?.trim() || null,
          registration_source: "eventbrite",
          external_registration_id: attendee.id,
          external_barcode: barcode,
          status: isCancelled ? ("cancelled" as const) : ("registered" as const),
        };

        if (existing) {
          const { error } = await supabaseAdmin.from("event_registrations").update(record).eq("id", existing.id);
          if (error) throw error;
          updated += 1;
        } else {
          const { error } = await supabaseAdmin.from("event_registrations").insert(record);
          if (error) throw error;
          imported += 1;
        }
      }
    }

    return { linkedEvents, imported, updated };
  });

