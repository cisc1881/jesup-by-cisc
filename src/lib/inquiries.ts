import { supabase } from "@/integrations/supabase/client";
import type { InstitutionType } from "@/lib/institutions";

export type InquiryType =
  | "join_program"
  | "request_info"
  | "partnership"
  | "student_opportunity"
  | "farmer_producer"
  | "volunteer"
  | "general";

export type InquiryStatus = "new" | "contacted" | "in_progress" | "resolved" | "closed";

export type PreferredContactMethod = "email" | "phone" | "either";

export type Inquiry = {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  preferredContact: PreferredContactMethod;
  organizationOrSchool: string | null;
  institutionId: string | null;
  institutionType: InstitutionType | null;
  city: string | null;
  state: string | null;
  county: string | null;
  inquiryType: InquiryType;
  programId: string | null;
  message: string | null;
  consentContact: boolean;
  newsletterOptIn: boolean;
  status: InquiryStatus;
  assignedTo: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  programName?: string | null;
  institutionName?: string | null;
};

export type SubmitInquiryInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  preferredContact?: PreferredContactMethod;
  organizationOrSchool?: string | null;
  institutionId?: string | null;
  institutionType?: InstitutionType | null;
  city?: string | null;
  state?: string | null;
  county?: string | null;
  inquiryType: InquiryType;
  programId?: string | null;
  message?: string | null;
  consentContact: boolean;
  newsletterOptIn?: boolean;
  userId?: string | null;
};

export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  join_program: "Join a CISC program",
  request_info: "Request information",
  partnership: "Partnership opportunities",
  student_opportunity: "Student opportunities",
  farmer_producer: "Farmer or producer services",
  volunteer: "Volunteering",
  general: "General inquiry",
};

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const INQUIRY_TYPES: InquiryType[] = [
  "join_program",
  "request_info",
  "partnership",
  "student_opportunity",
  "farmer_producer",
  "volunteer",
  "general",
];

export const INQUIRY_STATUSES: InquiryStatus[] = [
  "new",
  "contacted",
  "in_progress",
  "resolved",
  "closed",
];

export const INQUIRY_US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
] as const;

export type AdminStaffMember = {
  id: string;
  fullName: string | null;
  email: string | null;
};

export type InquiryNote = {
  id: string;
  inquiryId: string;
  authorId: string;
  body: string;
  createdAt: string;
  authorName: string | null;
  authorEmail: string | null;
};

export type InquiryFilters = {
  status?: InquiryStatus;
  inquiryType?: InquiryType;
  programId?: string;
  state?: string;
  institutionType?: InstitutionType;
};

const inquirySelect = `
  id,
  user_id,
  first_name,
  last_name,
  email,
  phone,
  preferred_contact,
  organization_or_school,
  institution_id,
  institution_type,
  city,
  state,
  county,
  inquiry_type,
  program_id,
  message,
  consent_contact,
  newsletter_opt_in,
  status,
  assigned_to,
  submitted_at,
  created_at,
  updated_at,
  programs ( name ),
  institutions ( name )
`;

function mapInquiry(row: Record<string, unknown>): Inquiry {
  const program = row.programs as { name: string } | null;
  const institution = row.institutions as { name: string } | null;

  return {
    id: row.id as string,
    userId: (row.user_id as string | null) ?? null,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string,
    phone: (row.phone as string | null) ?? null,
    preferredContact: row.preferred_contact as PreferredContactMethod,
    organizationOrSchool: (row.organization_or_school as string | null) ?? null,
    institutionId: (row.institution_id as string | null) ?? null,
    institutionType: (row.institution_type as InstitutionType | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    county: (row.county as string | null) ?? null,
    inquiryType: row.inquiry_type as InquiryType,
    programId: (row.program_id as string | null) ?? null,
    message: (row.message as string | null) ?? null,
    consentContact: Boolean(row.consent_contact),
    newsletterOptIn: Boolean(row.newsletter_opt_in),
    status: row.status as InquiryStatus,
    assignedTo: (row.assigned_to as string | null) ?? null,
    submittedAt: row.submitted_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    programName: program?.name ?? null,
    institutionName: institution?.name ?? null,
  };
}

export async function submitInquiry(input: SubmitInquiryInput) {
  if (!input.consentContact) {
    throw new Error("Consent to be contacted is required.");
  }

  const payload = {
    user_id: input.userId ?? null,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    preferred_contact: input.preferredContact ?? "either",
    organization_or_school: input.organizationOrSchool?.trim() || null,
    institution_id: input.institutionId ?? null,
    institution_type: input.institutionType ?? null,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    county: input.county?.trim() || null,
    inquiry_type: input.inquiryType,
    program_id: input.programId ?? null,
    message: input.message?.trim() || null,
    consent_contact: true,
    newsletter_opt_in: Boolean(input.newsletterOptIn),
  };

  const { data, error } = await supabase.from("inquiries").insert(payload).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function listAdminInquiries(options?: InquiryFilters) {
  let query = supabase.from("inquiries").select(inquirySelect).order("submitted_at", { ascending: false });

  if (options?.status) query = query.eq("status", options.status);
  if (options?.inquiryType) query = query.eq("inquiry_type", options.inquiryType);
  if (options?.programId) query = query.eq("program_id", options.programId);
  if (options?.state) query = query.eq("state", options.state);
  if (options?.institutionType) query = query.eq("institution_type", options.institutionType);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapInquiry(row as Record<string, unknown>));
}

export async function countNewInquiries() {
  const { count, error } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");
  if (error) throw error;
  return count ?? 0;
}

export async function listAdminStaff(): Promise<AdminStaffMember[]> {
  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  if (rolesError) throw rolesError;

  const ids = [...new Set((roles ?? []).map((row) => row.user_id as string))];
  if (ids.length === 0) return [];

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids)
    .order("full_name");

  if (error) throw error;

  return (profiles ?? []).map((row) => ({
    id: row.id as string,
    fullName: (row.full_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
  }));
}

export function formatInquiryReference(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function matchesInquirySearch(inquiry: Inquiry, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    inquiry.firstName.toLowerCase().includes(needle) ||
    inquiry.lastName.toLowerCase().includes(needle) ||
    inquiry.email.toLowerCase().includes(needle) ||
    (inquiry.organizationOrSchool ?? "").toLowerCase().includes(needle) ||
    (inquiry.programName ?? "").toLowerCase().includes(needle) ||
    (inquiry.institutionName ?? "").toLowerCase().includes(needle) ||
    formatInquiryReference(inquiry.id).toLowerCase().includes(needle)
  );
}

export async function getInquiry(id: string) {
  const { data, error } = await supabase.from("inquiries").select(inquirySelect).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapInquiry(data as Record<string, unknown>) : null;
}

export async function updateInquiryStatus(id: string, status: InquiryStatus, assignedTo?: string | null) {
  const payload: Record<string, unknown> = { status };
  if (assignedTo !== undefined) payload.assigned_to = assignedTo;

  const { error } = await supabase.from("inquiries").update(payload).eq("id", id);
  if (error) throw error;
}

export async function addInquiryNote(inquiryId: string, authorId: string, body: string) {
  const { error } = await supabase.from("inquiry_notes").insert({
    inquiry_id: inquiryId,
    author_id: authorId,
    body: body.trim(),
  });
  if (error) throw error;
}

export async function listInquiryNotes(inquiryId: string) {
  const { data, error } = await supabase
    .from("inquiry_notes")
    .select("id, inquiry_id, author_id, body, created_at, profiles ( full_name, email )")
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const profile = row.profiles as { full_name: string | null; email: string | null } | null;
    return {
      id: row.id as string,
      inquiryId: row.inquiry_id as string,
      authorId: row.author_id as string,
      body: row.body as string,
      createdAt: row.created_at as string,
      authorName: profile?.full_name ?? null,
      authorEmail: profile?.email ?? null,
    };
  });
}

export async function listMyInquiries(userId: string) {
  const { data, error } = await supabase
    .from("inquiries")
    .select(inquirySelect)
    .eq("user_id", userId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapInquiry(row as Record<string, unknown>));
}
