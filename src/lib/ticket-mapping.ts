import { z } from "zod";

export const mappingInput = z.object({
  eventId: z.string().uuid(),
  ticketClass: z.string().trim().min(1).max(200),
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  remove: z.boolean().default(false),
});

/** Counts registrations per ticket class without exposing any attendee fields. */
export function summarizeTicketClasses(rows: { eventbrite_ticket_class: string | null; status: string }[]) {
  const map = new Map<string, { ticketClass: string; registered: number; cancelled: number }>();
  for (const r of rows) {
    const key = r.eventbrite_ticket_class?.trim();
    if (!key) continue;
    const item = map.get(key) ?? { ticketClass: key, registered: 0, cancelled: 0 };
    if (r.status === "registered") item.registered++; else item.cancelled++;
    map.set(key, item);
  }
  return [...map.values()].sort((a, b) => a.ticketClass.localeCompare(b.ticketClass));
}
