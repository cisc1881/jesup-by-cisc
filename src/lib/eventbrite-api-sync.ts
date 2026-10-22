/** Live Eventbrite API sync, normalized into the same validated import path as CSV.
 * No direct table writes: every event goes through import_eventbrite_registrations. */
import { EVENTBRITE_IMPORT_MAX_ROWS, contentRequestId, validateImportCandidates, type EventbriteImportRow, type EventbriteLineIssue } from "./eventbrite-import";

export type EventbriteApiAttendee = {
  id?: string | number;
  status?: string;
  cancelled?: boolean;
  refunded?: boolean;
  profile?: { name?: string; first_name?: string; last_name?: string; email?: string };
  barcodes?: Array<{ barcode?: string; status?: string }>;
  answers?: Array<{ question?: string; answer?: string }>;
};

const CONSENT_YES = /^(yes|true|i agree|authorized)$/i;
/** Same question patterns and consent rule as the original direct-write sync. */
export function extractAccommodations(a: EventbriteApiAttendee) {
  const answerFor = (patterns: string[]) =>
    a.answers?.find((x) => patterns.some((p) => (x.question ?? "").toLowerCase().includes(p)))?.answer?.trim() || null;
  return {
    consent: CONSENT_YES.test(answerFor(["authorize jesup", "accommodation consent", "coordinate this event"]) ?? ""),
    dietary: answerFor(["dietary", "diet preference", "diet restriction"]),
    allergies: answerFor(["food allerg", "allergies"]),
    accessibility: answerFor(["accessibility", "accommodation", "access need"]),
  };
}
type Page = { attendees?: EventbriteApiAttendee[]; pagination?: { page_count?: number; has_more_items?: boolean; continuation?: string } };
export type FetchLike = (url: string, init: { headers: Record<string, string> }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export const EVENTBRITE_SYNC_MAX_PAGES = 60; // 60 × 100 > 5000-row import limit
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export class EventbriteSyncError extends Error {}

export async function listEventbriteAttendees(
  eventbriteEventId: string,
  token: string,
  opts: { fetch: FetchLike; maxPages?: number; retries?: number; sleep?: (ms: number) => Promise<void> },
) {
  const maxPages = opts.maxPages ?? EVENTBRITE_SYNC_MAX_PAGES, retries = opts.retries ?? 2;
  const sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const attendees: EventbriteApiAttendee[] = [];
  let continuation: string | undefined;
  for (let page = 1; ; page++) {
    if (page > maxPages) throw new EventbriteSyncError(`Stopped after ${maxPages} pages; nothing was imported.`);
    const url = new URL(`https://www.eventbriteapi.com/v3/events/${encodeURIComponent(eventbriteEventId)}/attendees/`);
    if (continuation) url.searchParams.set("continuation", continuation); else url.searchParams.set("page", String(page));
    let payload: Page | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      let res;
      try { res = await opts.fetch(url.toString(), { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }); }
      catch { if (attempt < retries) { await sleep(500 * 2 ** attempt); continue; } throw new EventbriteSyncError(`Eventbrite network error on page ${page}; nothing was imported.`); }
      if (res.ok) { payload = (await res.json()) as Page; break; }
      if (RETRYABLE.has(res.status) && attempt < retries) { await sleep(500 * 2 ** attempt); continue; }
      throw new EventbriteSyncError(`Eventbrite request failed (${res.status}) on page ${page}; nothing was imported.`);
    }
    if (!payload || !Array.isArray(payload.attendees)) throw new EventbriteSyncError(`Unexpected Eventbrite response on page ${page}; nothing was imported.`);
    attendees.push(...payload.attendees);
    if (attendees.length > EVENTBRITE_IMPORT_MAX_ROWS) throw new EventbriteSyncError(`More than ${EVENTBRITE_IMPORT_MAX_ROWS} attendees; nothing was imported.`);
    const p = payload.pagination ?? {};
    continuation = p.continuation || undefined;
    if (!p.has_more_items && page >= (p.page_count ?? page)) break;
  }
  return attendees;
}

export function normalizeApiAttendees(attendees: EventbriteApiAttendee[]): { rows: EventbriteImportRow[]; issues: EventbriteLineIssue[] } {
  return validateImportCandidates(attendees.map((a, i) => ({
    line: i + 1, // position in provider list, no attendee data
    external_id: a.id == null ? "" : String(a.id),
    barcode: a.barcodes?.find((b) => b.barcode?.trim())?.barcode ?? "",
    email: a.profile?.email ?? "",
    name: a.profile?.name?.trim() || [a.profile?.first_name, a.profile?.last_name].filter(Boolean).join(" ") || "Eventbrite attendee",
    accommodations: extractAccommodations(a),
    cancelled: Boolean(a.cancelled || a.refunded) || /(not attending|cancel|refund|deleted|void|transferred)/i.test(a.status ?? ""),
  })));
}

export type ImportRpc = (args: { p_event_id: string; p_request_id: string; p_rows: EventbriteImportRow[]; p_dry_run: boolean; p_file_sha256: string }) =>
  Promise<{ data: unknown; error: { message: string } | null }>;
export type Counts = Record<"new" | "update" | "duplicate" | "conflict" | "cancelled" | "invalid", number>;
export type EventSyncReport = { eventId: string; title: string; ok: boolean; error?: string; replayed?: boolean; counts?: Counts; issues?: { line: number; outcome: string; reason: string }[] };

export async function syncOneEvent(
  event: { id: string; title: string; eventbriteEventId: string },
  deps: { token: string; fetch: FetchLike; rpc: ImportRpc; sleep?: (ms: number) => Promise<void>; maxPages?: number },
): Promise<EventSyncReport> {
  try {
    const attendees = await listEventbriteAttendees(event.eventbriteEventId, deps.token, { fetch: deps.fetch, sleep: deps.sleep, maxPages: deps.maxPages });
    const { rows, issues } = normalizeApiAttendees(attendees);
    const digest = JSON.stringify(rows);
    const requestId = await contentRequestId(`eventbrite-api:${event.id}:${digest}`);
    const { data, error } = await deps.rpc({ p_event_id: event.id, p_request_id: requestId, p_rows: rows, p_dry_run: false, p_file_sha256: (await contentRequestId(digest)).replace(/-/g, "") });
    if (error) return { eventId: event.id, title: event.title, ok: false, error: /capacity/i.test(error.message) ? "Event capacity reached; nothing was imported." : "Import was rejected; nothing was imported." };
    const r = data as { counts: Counts; issues?: EventSyncReport["issues"]; replayed?: boolean };
    return {
      eventId: event.id, title: event.title, ok: true, replayed: Boolean(r.replayed),
      counts: { ...r.counts, invalid: (r.counts?.invalid ?? 0) + issues.length },
      issues: [...issues, ...(r.issues ?? [])].sort((a, b) => a.line - b.line).slice(0, 200),
    };
  } catch (e) {
    return { eventId: event.id, title: event.title, ok: false, error: e instanceof EventbriteSyncError ? e.message : "Unexpected sync error; nothing was imported." };
  }
}
