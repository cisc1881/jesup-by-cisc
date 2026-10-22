/** Eventbrite attendee CSV parsing for admin-only, event-scoped imports.
 * Parsing and file-level validation happen here; the database function
 * import_eventbrite_registrations is the authoritative matcher/writer. */

export const EVENTBRITE_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const EVENTBRITE_IMPORT_MAX_ROWS = 5000;

/** Column aliases taken from Eventbrite "Attendee Summary" / Orders exports. */
export const EVENTBRITE_COLUMNS = {
  externalId: ["attendee #", "attendee id", "attendee no."],
  barcode: ["barcode #", "barcode", "barcode number"],
  email: ["email", "email address", "attendee email"],
  firstName: ["first name"],
  lastName: ["last name"],
  name: ["name", "attendee name", "full name"],
  status: ["attendee status", "status"],
  orderId: ["order #", "order id"],
  ticketType: ["ticket type"],
} as const;

export const EVENTBRITE_TEMPLATE_HEADER =
  "Order #,Order Date,First Name,Last Name,Email,Quantity,Ticket Type,Attendee #,Barcode #,Attendee Status";

export type EventbriteImportRow = {
  line: number;
  external_id: string;
  email: string;
  name: string;
  barcode: string;
  status: "registered" | "cancelled";
};
export type EventbriteLineIssue = { line: number; outcome: "invalid"; reason: string };
export type EventbriteParseResult =
  | { ok: false; error: string }
  | { ok: true; rows: EventbriteImportRow[]; issues: EventbriteLineIssue[]; ignoredColumns: string[] };

const CANCELLED = /(not attending|cancel|refund|deleted|void|transferred)/i;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** RFC-4180-ish parser that keeps the source line number of each record. */
export function parseCsvWithLines(text: string): { line: number; cells: string[] }[] {
  const out: { line: number; cells: string[] }[] = [];
  let row: string[] = [], field = "", quoted = false, line = 1, start = 1;
  const push = () => {
    row.push(field.trim());
    if (row.some((c) => c.length)) out.push({ line: start, cells: row });
    row = []; field = "";
  };
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else { if (c === "\n") line++; field += c; }
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") { row.push(field.trim()); field = ""; }
    else if (c === "\r") continue;
    else if (c === "\n") { push(); line++; start = line; }
    else field += c;
  }
  if (field.length || row.length) push();
  return out;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function mapEventbriteStatus(value: string): "registered" | "cancelled" {
  return CANCELLED.test(value) ? "cancelled" : "registered";
}

export function parseEventbriteCsv(text: string): EventbriteParseResult {
  if (new TextEncoder().encode(text).length > EVENTBRITE_IMPORT_MAX_BYTES) return { ok: false, error: "File is larger than 2 MB." };
  const records = parseCsvWithLines(text);
  if (records.length < 2) return { ok: false, error: "File has no attendee rows." };
  const header = records[0].cells.map((h) => h.toLowerCase().replace(/\s+/g, " ").trim());
  const find = (aliases: readonly string[]) => header.findIndex((h) => aliases.includes(h));
  const idx = Object.fromEntries(Object.entries(EVENTBRITE_COLUMNS).map(([k, a]) => [k, find(a)])) as Record<keyof typeof EVENTBRITE_COLUMNS, number>;
  const missing: string[] = [];
  if (idx.externalId < 0) missing.push("Attendee #");
  if (idx.barcode < 0) missing.push("Barcode #");
  if (idx.email < 0) missing.push("Email");
  if (idx.name < 0 && idx.firstName < 0 && idx.lastName < 0) missing.push("First Name/Last Name");
  if (missing.length) return { ok: false, error: `Missing required Eventbrite columns: ${missing.join(", ")}.` };
  if (records.length - 1 > EVENTBRITE_IMPORT_MAX_ROWS) return { ok: false, error: `File has more than ${EVENTBRITE_IMPORT_MAX_ROWS} rows.` };

  const used = new Set(Object.values(idx).filter((i) => i >= 0));
  const ignoredColumns = records[0].cells.filter((_, i) => !used.has(i));
  const rows: EventbriteImportRow[] = [];
  const issues: EventbriteLineIssue[] = [];
  const seenIds = new Map<string, number>(), seenBarcodes = new Map<string, number>();
  for (const { line, cells } of records.slice(1)) {
    const get = (i: number) => (i >= 0 ? (cells[i] ?? "").trim() : "");
    const external_id = get(idx.externalId), barcode = get(idx.barcode), email = normalizeEmail(get(idx.email));
    const name = (get(idx.name) || [get(idx.firstName), get(idx.lastName)].filter(Boolean).join(" ")).slice(0, 200);
    const bad = (reason: string) => issues.push({ line, outcome: "invalid", reason });
    if (!external_id || external_id.length > 100) { bad("Missing or too-long Attendee #"); continue; }
    if (!EMAIL.test(email)) { bad("Missing or invalid email"); continue; }
    if (barcode.length < 6 || barcode.length > 256) { bad("Missing or invalid Barcode #"); continue; }
    if (seenIds.has(external_id)) { bad(`Duplicate Attendee # (also on line ${seenIds.get(external_id)})`); continue; }
    if (seenBarcodes.has(barcode)) { bad(`Duplicate Barcode # (also on line ${seenBarcodes.get(barcode)})`); continue; }
    seenIds.set(external_id, line); seenBarcodes.set(barcode, line);
    rows.push({ line, external_id, email, name, barcode, status: mapEventbriteStatus(get(idx.status)) });
  }
  return { ok: true, rows, issues, ignoredColumns };
}

/** Hex SHA-256 of the file for the audit record (no attendee data stored). */
export async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
