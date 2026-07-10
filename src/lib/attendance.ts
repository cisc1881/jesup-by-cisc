import { supabase } from "@/integrations/supabase/client";
import { parseCsv, toCsv, type CsvColumn } from "@/lib/csv";

export type AttendanceStatus =
  | "registered"
  | "checked_in"
  | "attended"
  | "virtual"
  | "no_show"
  | "cancelled";

export type AttendanceMethod = "qr" | "manual" | "csv_import" | "walk_in";

export type AttendanceFilter =
  | "all"
  | "registered"
  | "checked_in"
  | "attended"
  | "virtual"
  | "walk_ins"
  | "no_show"
  | "cancelled";

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "registered",
  "checked_in",
  "attended",
  "virtual",
  "no_show",
  "cancelled",
];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  registered: "Registered",
  checked_in: "Checked in",
  attended: "Attended",
  virtual: "Virtual",
  no_show: "No-show",
  cancelled: "Cancelled",
};

export const ATTENDANCE_METHOD_LABELS: Record<AttendanceMethod, string> = {
  qr: "QR",
  manual: "Manual",
  csv_import: "CSV import",
  walk_in: "Walk-in",
};

export type EventAttendanceRow = {
  id: string;
  eventId: string;
  registrationId: string | null;
  walkInId: string | null;
  status: AttendanceStatus;
  attendanceMethod: AttendanceMethod | null;
  checkedInAt: string | null;
  notes: string | null;
  evaluationCompletedAt: string | null;
  participantName: string;
  email: string | null;
  phone: string | null;
  organizationOrSchool: string | null;
  county: string | null;
  state: string | null;
  registrationType: "registered" | "walk_in";
  registrationStatus: string | null;
  ticketCode: string | null;
  isWalkIn: boolean;
};

export type EventWalkIn = {
  id: string;
  eventId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  organizationOrSchool: string | null;
  county: string | null;
  state: string | null;
  attendanceType: AttendanceStatus;
  createdAt: string;
};

export type AttendanceSummary = {
  totalRegistered: number;
  checkedIn: number;
  attended: number;
  virtual: number;
  walkIns: number;
  noShows: number;
  cancelled: number;
  /** (attended + checked_in + virtual) / eligible participants */
  attendanceRate: number;
};

export type WalkInInput = {
  eventId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  organizationOrSchool?: string | null;
  county?: string | null;
  state?: string | null;
  attendanceType?: AttendanceStatus;
  notes?: string | null;
  adminUserId?: string | null;
};

export type MarkAttendanceInput = {
  eventId: string;
  attendanceId: string;
  status: AttendanceStatus;
  adminUserId?: string | null;
  notes?: string | null;
  attendanceMethod?: AttendanceMethod;
  syncLegacyCheckin?: boolean;
  checkedInAt?: string | null;
};

export type CsvAttendanceRow = {
  ticket_code?: string;
  email?: string;
  full_name?: string;
  status?: string;
  checked_in_at?: string;
  organization_or_school?: string;
  county?: string;
  state?: string;
};

export type CsvImportPreviewRow = {
  lineNumber: number;
  data: CsvAttendanceRow;
  reason?: string;
  registrationId?: string;
  attendanceId?: string;
};

export type CsvImportPreview = {
  matched: CsvImportPreviewRow[];
  unmatched: CsvImportPreviewRow[];
  duplicate: CsvImportPreviewRow[];
  invalid: CsvImportPreviewRow[];
  validCount: number;
};

const attendanceSelect = `
  id,
  event_id,
  registration_id,
  walk_in_id,
  status,
  attendance_method,
  checked_in_at,
  checked_in_by,
  notes,
  evaluation_completed_at,
  created_at,
  updated_at
`;

const CHECK_IN_STATUSES: AttendanceStatus[] = ["checked_in", "attended", "virtual"];

function mapWalkIn(row: Record<string, unknown>): EventWalkIn {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    fullName: row.full_name as string,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    organizationOrSchool: (row.organization_or_school as string | null) ?? null,
    county: (row.county as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    attendanceType: row.attendance_type as AttendanceStatus,
    createdAt: row.created_at as string,
  };
}

function registrationAttendanceStatus(
  regStatus: string,
  checkedInAt: string | null,
): AttendanceStatus {
  if (regStatus === "cancelled") return "cancelled";
  if (checkedInAt) return "checked_in";
  return "registered";
}

async function fetchRegistrationsForEvent(eventId: string) {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("id, event_id, user_id, notes, status, ticket_code, checked_in_at, created_at, profiles ( full_name, email, phone, affiliation )")
    .eq("event_id", eventId);
  if (error) throw error;
  return data ?? [];
}

async function fetchWalkInsForEvent(eventId: string) {
  const { data, error } = await supabase
    .from("event_walk_ins")
    .select("id, event_id, full_name, email, phone, organization_or_school, county, state, attendance_type, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Ensure every registration has a canonical event_attendance row (idempotent). */
export async function ensureRegistrationAttendanceRecords(eventId: string) {
  const registrations = await fetchRegistrationsForEvent(eventId);
  if (registrations.length === 0) return;

  const { data: existing, error } = await supabase
    .from("event_attendance")
    .select("registration_id")
    .eq("event_id", eventId)
    .not("registration_id", "is", null);
  if (error) throw error;

  const existingIds = new Set((existing ?? []).map((row) => row.registration_id as string));
  const missing = registrations.filter((reg) => !existingIds.has(reg.id));
  if (missing.length === 0) return;

  const inserts = missing.map((reg) => ({
    event_id: eventId,
    registration_id: reg.id,
    status: registrationAttendanceStatus(reg.status as string, reg.checked_in_at as string | null),
    attendance_method: reg.checked_in_at ? ("manual" as AttendanceMethod) : null,
    checked_in_at: (reg.checked_in_at as string | null) ?? null,
    created_at: reg.created_at as string,
  }));

  const { error: insertError } = await supabase.from("event_attendance").insert(inserts);
  if (insertError) throw insertError;
}

function buildAttendanceRow(
  attendance: Record<string, unknown>,
  registration?: Record<string, unknown> | null,
  walkIn?: Record<string, unknown> | null,
): EventAttendanceRow {
  const profile = registration?.profiles as {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    affiliation: string | null;
  } | null;

  const isWalkIn = !!attendance.walk_in_id;

  return {
    id: attendance.id as string,
    eventId: attendance.event_id as string,
    registrationId: (attendance.registration_id as string | null) ?? null,
    walkInId: (attendance.walk_in_id as string | null) ?? null,
    status: attendance.status as AttendanceStatus,
    attendanceMethod: (attendance.attendance_method as AttendanceMethod | null) ?? null,
    checkedInAt: (attendance.checked_in_at as string | null) ?? null,
    notes: (attendance.notes as string | null) ?? null,
    evaluationCompletedAt: (attendance.evaluation_completed_at as string | null) ?? null,
    participantName: isWalkIn
      ? (walkIn?.full_name as string)
      : (profile?.full_name ?? "—"),
    email: isWalkIn ? ((walkIn?.email as string | null) ?? null) : (profile?.email ?? null),
    phone: isWalkIn ? ((walkIn?.phone as string | null) ?? null) : (profile?.phone ?? null),
    organizationOrSchool: isWalkIn
      ? ((walkIn?.organization_or_school as string | null) ?? null)
      : (profile?.affiliation ?? (registration?.notes as string | null) ?? null),
    county: isWalkIn ? ((walkIn?.county as string | null) ?? null) : null,
    state: isWalkIn ? ((walkIn?.state as string | null) ?? null) : null,
    registrationType: isWalkIn ? "walk_in" : "registered",
    registrationStatus: isWalkIn ? null : ((registration?.status as string | null) ?? null),
    ticketCode: isWalkIn ? null : ((registration?.ticket_code as string | null) ?? null),
    isWalkIn,
  };
}

export async function listEventAttendance(eventId: string): Promise<EventAttendanceRow[]> {
  await ensureRegistrationAttendanceRecords(eventId);

  const [attendanceRes, registrations, walkIns] = await Promise.all([
    supabase.from("event_attendance").select(attendanceSelect).eq("event_id", eventId).order("created_at"),
    fetchRegistrationsForEvent(eventId),
    fetchWalkInsForEvent(eventId),
  ]);

  if (attendanceRes.error) throw attendanceRes.error;

  const regMap = new Map(registrations.map((row) => [row.id, row]));
  const walkMap = new Map(walkIns.map((row) => [row.id, row]));

  return (attendanceRes.data ?? []).map((row) =>
    buildAttendanceRow(
      row as Record<string, unknown>,
      row.registration_id ? regMap.get(row.registration_id as string) : null,
      row.walk_in_id ? walkMap.get(row.walk_in_id as string) : null,
    ),
  );
}

export async function listEventWalkIns(eventId: string): Promise<EventWalkIn[]> {
  const rows = await fetchWalkInsForEvent(eventId);
  return rows.map((row) => mapWalkIn(row as Record<string, unknown>));
}

/**
 * Attendance rate = (attended + checked_in + virtual) / eligible participants.
 * Eligible = registered attendance rows that are not cancelled + all walk-ins.
 */
export function computeAttendanceRate(summary: Omit<AttendanceSummary, "attendanceRate">) {
  const numerator = summary.attended + summary.checkedIn + summary.virtual;
  const eligible = Math.max(0, summary.totalRegistered - summary.cancelled) + summary.walkIns;
  if (eligible === 0) return 0;
  return Math.round((numerator / eligible) * 1000) / 10;
}

export async function getAttendanceSummary(eventId: string): Promise<AttendanceSummary> {
  const rows = await listEventAttendance(eventId);

  const summary = {
    totalRegistered: rows.filter((row) => !row.isWalkIn).length,
    checkedIn: rows.filter((row) => row.status === "checked_in").length,
    attended: rows.filter((row) => row.status === "attended").length,
    virtual: rows.filter((row) => row.status === "virtual").length,
    walkIns: rows.filter((row) => row.isWalkIn).length,
    noShows: rows.filter((row) => row.status === "no_show").length,
    cancelled: rows.filter((row) => row.status === "cancelled").length,
    attendanceRate: 0,
  };

  summary.attendanceRate = computeAttendanceRate(summary);
  return summary;
}

async function syncLegacyCheckin(
  registrationId: string,
  eventId: string,
  adminUserId: string | null,
  checkedInAt: string,
) {
  const { error: regError } = await supabase
    .from("event_registrations")
    .update({ checked_in_at: checkedInAt })
    .eq("id", registrationId);
  if (regError) throw regError;

  const { error: checkinError } = await supabase.from("event_checkins").insert({
    registration_id: registrationId,
    event_id: eventId,
    checked_in_at: checkedInAt,
    checked_in_by: adminUserId,
    method: "manual",
  });
  if (checkinError) throw checkinError;
}

export async function updateAttendanceNotes(
  eventId: string,
  attendanceId: string,
  notes: string | null,
) {
  const { error } = await supabase
    .from("event_attendance")
    .update({ notes })
    .eq("id", attendanceId)
    .eq("event_id", eventId);
  if (error) throw error;
}

export async function updateAttendanceStatus(input: MarkAttendanceInput) {
  const now = new Date().toISOString();
  const shouldTimestamp = CHECK_IN_STATUSES.includes(input.status);

  const { data: existing, error: fetchError } = await supabase
    .from("event_attendance")
    .select("id, registration_id, event_id, checked_in_at")
    .eq("id", input.attendanceId)
    .eq("event_id", input.eventId)
    .single();
  if (fetchError) throw fetchError;

  const payload: Record<string, unknown> = {
    status: input.status,
    notes: input.notes ?? undefined,
  };

  if (shouldTimestamp) {
    payload.checked_in_at = input.checkedInAt ?? existing.checked_in_at ?? now;
    payload.checked_in_by = input.adminUserId ?? null;
    payload.attendance_method = input.attendanceMethod ?? "manual";
  }

  if (input.status === "registered") {
    payload.checked_in_at = null;
    payload.checked_in_by = null;
    payload.attendance_method = null;
  }

  const { error } = await supabase.from("event_attendance").update(payload).eq("id", input.attendanceId);
  if (error) throw error;

  if (
    input.syncLegacyCheckin !== false &&
    existing.registration_id &&
    input.status === "checked_in"
  ) {
    await syncLegacyCheckin(
      existing.registration_id,
      input.eventId,
      input.adminUserId ?? null,
      (payload.checked_in_at as string) ?? now,
    );
  }
}

export async function markRegistrationAttendance(options: {
  eventId: string;
  registrationId: string;
  status: AttendanceStatus;
  adminUserId?: string | null;
  notes?: string | null;
  attendanceMethod?: AttendanceMethod;
  syncLegacyCheckin?: boolean;
}) {
  await ensureRegistrationAttendanceRecords(options.eventId);

  const { data: attendance, error } = await supabase
    .from("event_attendance")
    .select("id")
    .eq("event_id", options.eventId)
    .eq("registration_id", options.registrationId)
    .maybeSingle();
  if (error) throw error;
  if (!attendance) throw new Error("Attendance record not found for registration.");

  await updateAttendanceStatus({
    eventId: options.eventId,
    attendanceId: attendance.id,
    status: options.status,
    adminUserId: options.adminUserId,
    notes: options.notes,
    attendanceMethod: options.attendanceMethod ?? "manual",
    syncLegacyCheckin: options.syncLegacyCheckin ?? options.status === "checked_in",
  });

  return attendance.id;
}

export async function bulkUpdateAttendanceStatus(
  eventId: string,
  attendanceIds: string[],
  status: AttendanceStatus,
  adminUserId?: string | null,
) {
  for (const attendanceId of attendanceIds) {
    await updateAttendanceStatus({
      eventId,
      attendanceId,
      status,
      adminUserId,
      attendanceMethod: status === "checked_in" ? "manual" : undefined,
      syncLegacyCheckin: status === "checked_in",
    });
  }
}

export async function findRegistrationByTicketCode(eventId: string, ticketCode: string) {
  const code = ticketCode.trim().toUpperCase();
  if (!code) return null;

  const { data, error } = await supabase
    .from("event_registrations")
    .select("id, event_id, status, ticket_code, checked_in_at, profiles ( full_name, email )")
    .eq("event_id", eventId)
    .eq("ticket_code", code)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function checkInByTicketCode(
  eventId: string,
  ticketCode: string,
  adminUserId?: string | null,
  notes?: string | null,
) {
  const registration = await findRegistrationByTicketCode(eventId, ticketCode);
  if (!registration) throw new Error("No registration found for that ticket code.");

  return markRegistrationAttendance({
    eventId,
    registrationId: registration.id,
    status: "checked_in",
    adminUserId,
    notes,
    attendanceMethod: "manual",
    syncLegacyCheckin: true,
  });
}

export async function addWalkIn(input: WalkInInput) {
  const status = input.attendanceType ?? "attended";
  const now = new Date().toISOString();

  const { data: walkIn, error: walkInError } = await supabase
    .from("event_walk_ins")
    .insert({
      event_id: input.eventId,
      full_name: input.fullName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      organization_or_school: input.organizationOrSchool?.trim() || null,
      county: input.county?.trim() || null,
      state: input.state?.trim() || null,
      attendance_type: status,
      created_by: input.adminUserId ?? null,
    })
    .select("id")
    .single();
  if (walkInError) throw walkInError;

  const { data: attendance, error: attendanceError } = await supabase
    .from("event_attendance")
    .insert({
      event_id: input.eventId,
      walk_in_id: walkIn.id,
      status,
      attendance_method: "walk_in",
      checked_in_at: CHECK_IN_STATUSES.includes(status) ? now : null,
      checked_in_by: input.adminUserId ?? null,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();
  if (attendanceError) throw attendanceError;

  return { walkInId: walkIn.id, attendanceId: attendance.id };
}

export function matchesAttendanceFilter(row: EventAttendanceRow, filter: AttendanceFilter) {
  if (filter === "all") return true;
  if (filter === "walk_ins") return row.isWalkIn;
  return row.status === filter;
}

export function matchesAttendanceSearch(row: EventAttendanceRow, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    row.participantName.toLowerCase().includes(needle) ||
    (row.email ?? "").toLowerCase().includes(needle) ||
    (row.organizationOrSchool ?? "").toLowerCase().includes(needle) ||
    (row.ticketCode ?? "").toLowerCase().includes(needle)
  );
}

const CSV_TEMPLATE_HEADERS = [
  "ticket_code",
  "email",
  "full_name",
  "status",
  "checked_in_at",
  "organization_or_school",
  "county",
  "state",
] as const;

export function attendanceCsvTemplate(): string {
  return toCsv([], CSV_TEMPLATE_HEADERS.map((header) => ({ header, get: () => "" })));
}

export function downloadAttendanceCsvTemplate() {
  const blob = new Blob([attendanceCsvTemplate()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "attendance-import-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function normalizeCsvRow(headers: string[], values: string[]): CsvAttendanceRow {
  const row: Record<string, string> = {};
  headers.forEach((header, index) => {
    row[header.trim().toLowerCase()] = (values[index] ?? "").trim();
  });
  return row as CsvAttendanceRow;
}

function isValidAttendanceStatus(status: string): status is AttendanceStatus {
  return ATTENDANCE_STATUSES.includes(status as AttendanceStatus);
}

export async function previewAttendanceCsvImport(
  eventId: string,
  csvText: string,
): Promise<CsvImportPreview> {
  await ensureRegistrationAttendanceRecords(eventId);
  const [attendanceRows, registrations] = await Promise.all([
    listEventAttendance(eventId),
    fetchRegistrationsForEvent(eventId),
  ]);

  const parsed = parseCsv(csvText.trim());
  if (parsed.length === 0) {
    return { matched: [], unmatched: [], duplicate: [], invalid: [], validCount: 0 };
  }

  const headers = parsed[0].map((h) => h.trim().toLowerCase());
  const dataRows = parsed.slice(1);

  const emailCounts = new Map<string, number>();
  for (const reg of registrations) {
    const profile = reg.profiles as { email: string | null } | null;
    const email = profile?.email?.trim().toLowerCase();
    if (email) emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1);
  }

  const matched: CsvImportPreviewRow[] = [];
  const unmatched: CsvImportPreviewRow[] = [];
  const duplicate: CsvImportPreviewRow[] = [];
  const invalid: CsvImportPreviewRow[] = [];
  const seenRegistrationIds = new Set<string>();

  dataRows.forEach((values, index) => {
    const lineNumber = index + 2;
    const data = normalizeCsvRow(headers, values);

    if (!data.ticket_code && !data.email && !data.full_name) return;

    if (data.status && !isValidAttendanceStatus(data.status)) {
      invalid.push({ lineNumber, data, reason: `Invalid status "${data.status}".` });
      return;
    }

    let registration: (typeof registrations)[number] | undefined;

    if (data.ticket_code) {
      const code = data.ticket_code.toUpperCase();
      registration = registrations.find((reg) => (reg.ticket_code as string)?.toUpperCase() === code);
      if (!registration) {
        unmatched.push({ lineNumber, data, reason: "No registration matched ticket code." });
        return;
      }
    } else if (data.email) {
      const email = data.email.toLowerCase();
      if ((emailCounts.get(email) ?? 0) !== 1) {
        unmatched.push({
          lineNumber,
          data,
          reason: "Email is not unique for this event or was not found.",
        });
        return;
      }
      registration = registrations.find((reg) => {
        const profile = reg.profiles as { email: string | null } | null;
        return profile?.email?.trim().toLowerCase() === email;
      });
      if (!registration) {
        unmatched.push({ lineNumber, data, reason: "No registration matched email." });
        return;
      }
    } else {
      unmatched.push({ lineNumber, data, reason: "Provide ticket_code or email to match a registration." });
      return;
    }

    if (seenRegistrationIds.has(registration.id)) {
      duplicate.push({ lineNumber, data, reason: "Duplicate match for the same registration." });
      return;
    }
    seenRegistrationIds.add(registration.id);

    const attendance = attendanceRows.find((row) => row.registrationId === registration!.id);
    matched.push({
      lineNumber,
      data,
      registrationId: registration.id,
      attendanceId: attendance?.id,
    });
  });

  return {
    matched,
    unmatched,
    duplicate,
    invalid,
    validCount: matched.length,
  };
}

export async function importAttendanceCsv(
  eventId: string,
  csvText: string,
  options?: {
    adminUserId?: string | null;
    importValidRowsOnly?: boolean;
    createWalkInsForUnmatched?: boolean;
  },
) {
  const preview = await previewAttendanceCsvImport(eventId, csvText);

  if (preview.invalid.length > 0 && !options?.importValidRowsOnly) {
    throw new Error("CSV contains invalid rows. Fix errors or import valid rows only.");
  }
  if (preview.duplicate.length > 0 && !options?.importValidRowsOnly) {
    throw new Error("CSV contains duplicate matches. Resolve duplicates before importing.");
  }

  for (const row of preview.matched) {
    if (!row.attendanceId || !row.data.status) continue;
    const checkedInAt = row.data.checked_in_at?.trim() || null;
    await updateAttendanceStatus({
      eventId,
      attendanceId: row.attendanceId,
      status: row.data.status as AttendanceStatus,
      adminUserId: options?.adminUserId,
      attendanceMethod: "csv_import",
      checkedInAt,
      notes: row.data.organization_or_school
        ? `CSV import · ${row.data.organization_or_school}`
        : "CSV import",
      syncLegacyCheckin: row.data.status === "checked_in",
    });
  }

  if (options?.createWalkInsForUnmatched) {
    for (const row of preview.unmatched) {
      if (!row.data.full_name) continue;
      await addWalkIn({
        eventId,
        fullName: row.data.full_name,
        email: row.data.email,
        organizationOrSchool: row.data.organization_or_school,
        county: row.data.county,
        state: row.data.state,
        attendanceType: (row.data.status as AttendanceStatus) || "attended",
        adminUserId: options.adminUserId,
        notes: "Created from CSV import",
      });
    }
  }

  return preview;
}

export const ATTENDANCE_EXPORT_COLUMNS: CsvColumn<EventAttendanceRow>[] = [
  { header: "participant_name", get: (r) => r.participantName },
  { header: "email", get: (r) => r.email },
  { header: "phone", get: (r) => r.phone },
  { header: "organization_or_school", get: (r) => r.organizationOrSchool },
  { header: "county", get: (r) => r.county },
  { header: "state", get: (r) => r.state },
  { header: "registration_status", get: (r) => r.registrationStatus },
  { header: "attendance_status", get: (r) => ATTENDANCE_STATUS_LABELS[r.status] },
  {
    header: "attendance_method",
    get: (r) => (r.attendanceMethod ? ATTENDANCE_METHOD_LABELS[r.attendanceMethod] : ""),
  },
  { header: "checked_in_at", get: (r) => r.checkedInAt },
  { header: "ticket_code", get: (r) => r.ticketCode },
  { header: "walk_in", get: (r) => (r.isWalkIn ? "yes" : "no") },
  { header: "evaluation_completed", get: (r) => (r.evaluationCompletedAt ? "yes" : "no") },
];

export function exportAttendanceCsv(rows: EventAttendanceRow[]) {
  return toCsv(rows, ATTENDANCE_EXPORT_COLUMNS);
}

export async function fetchEventAttendanceHeader(eventId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, starts_at, location")
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Event not found.");
  return {
    id: data.id as string,
    title: data.title as string,
    startsAt: data.starts_at as string,
    location: (data.location as string | null) ?? null,
  };
}
