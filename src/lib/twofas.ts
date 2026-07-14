import { supabase } from "@/integrations/supabase/client";
import type { AcademicLevel, InstitutionType } from "@/lib/institutions";

export const TWOFAS_DOCUMENTS_BUCKET = "twofas-documents";

export type TwofasTrack = "high_school" | "undergraduate" | "graduate" | "fellow";

export type MilestoneStatus = "pending" | "in_progress" | "completed" | "waived";

export type TwofasDocumentType = "resume" | "transcript" | "portfolio" | "other";

export type ApplicationStatus =
  | "pending"
  | "reviewed"
  | "under_review"
  | "accepted"
  | "waitlisted"
  | "rejected"
  | "active"
  | "completed"
  | "withdrawn";

export const TWOFAS_TRACK_LABELS: Record<TwofasTrack, string> = {
  high_school: "High school",
  undergraduate: "Undergraduate",
  graduate: "Graduate",
  fellow: "Graduate fellow",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  under_review: "Under review",
  accepted: "Accepted",
  waitlisted: "Waitlisted",
  rejected: "Rejected",
  active: "Active",
  completed: "Completed",
  withdrawn: "Withdrawn",
};

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "pending",
  "reviewed",
  "under_review",
  "accepted",
  "waitlisted",
  "rejected",
  "active",
  "completed",
  "withdrawn",
];

export const TWOFAS_TRACKS: TwofasTrack[] = ["high_school", "undergraduate", "graduate", "fellow"];

export const RESUMES_BUCKET = "resumes";

export type TwofasCohort = {
  id: string;
  name: string;
  track: TwofasTrack;
  year: number;
  description: string | null;
  startsOn: string | null;
  endsOn: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type TwofasCohortMilestone = {
  id: string;
  cohortId: string;
  title: string;
  description: string | null;
  dueOffsetDays: number | null;
  isRequired: boolean;
  sortOrder: number;
};

export type TwofasInternship = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  department: string | null;
  deadline: string | null;
  isOpen: boolean;
  track: TwofasTrack | null;
  programId: string | null;
  cohortId: string | null;
  is2fas: boolean;
  requirementsHtml: string | null;
  maxApplicants: number | null;
};

export type TwofasMentor = {
  id: string;
  userId: string | null;
  fullName: string;
  email: string | null;
  bio: string | null;
  expertise: string[];
  isActive: boolean;
};

export type TwofasMentorAssignment = {
  id: string;
  applicationId: string;
  mentorId: string;
  assignedAt: string;
  assignedBy: string | null;
  notes: string | null;
  mentor?: TwofasMentor;
};

export type TwofasStudentMilestone = {
  id: string;
  applicationId: string;
  milestoneId: string;
  status: MilestoneStatus;
  completedAt: string | null;
  notes: string | null;
  title: string;
  description: string | null;
  dueOffsetDays: number | null;
  isRequired: boolean;
  sortOrder: number;
};

export type TwofasDocument = {
  id: string;
  applicationId: string;
  userId: string;
  docType: TwofasDocumentType;
  filePath: string;
  label: string | null;
  createdAt: string;
};

export type TwofasApplication = {
  id: string;
  internshipId: string;
  userId: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  resumeUrl: string | null;
  cohortId: string | null;
  track: TwofasTrack | null;
  schoolName: string | null;
  major: string | null;
  graduationYear: number | null;
  institutionId: string | null;
  institutionType: InstitutionType | null;
  is1890LandGrant: boolean | null;
  academicLevel: AcademicLevel | null;
  institutionName?: string | null;
  emergencyContact: Record<string, unknown>;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  internship?: TwofasInternship | null;
  cohort?: TwofasCohort | null;
  applicantName?: string | null;
  applicantEmail?: string | null;
  mentorAssignment?: TwofasMentorAssignment | null;
  milestones?: TwofasStudentMilestone[];
  documents?: TwofasDocument[];
};

export type Submit2FASApplicationInput = {
  internshipId: string;
  userId: string;
  cohortId?: string | null;
  track?: TwofasTrack | null;
  coverLetter?: string | null;
  resumeUrl?: string | null;
  schoolName?: string | null;
  major?: string | null;
  graduationYear?: number | null;
  institutionId?: string | null;
  institutionType?: InstitutionType | null;
  is1890LandGrant?: boolean | null;
  academicLevel?: AcademicLevel | null;
  emergencyContact?: Record<string, unknown>;
};

export type SubmitInternshipApplicationInput = Submit2FASApplicationInput;

const cohortSelect =
  "id, name, track, year, description, starts_on, ends_on, is_active, sort_order";

const internshipSelect = `
  id, slug, title, description, department, deadline, is_open,
  track, program_id, cohort_id, is_2fas, requirements_html, max_applicants
`;

const applicationSelect = `
  id, internship_id, user_id, status, cover_letter, resume_url,
  cohort_id, track, school_name, major, graduation_year, emergency_contact,
  institution_id, institution_type, is_1890_land_grant, academic_level,
  submitted_at, reviewed_at, reviewed_by, created_at, updated_at,
  institutions ( name )
`;

function mapCohort(row: Record<string, unknown>): TwofasCohort {
  return {
    id: row.id as string,
    name: row.name as string,
    track: row.track as TwofasTrack,
    year: row.year as number,
    description: (row.description as string | null) ?? null,
    startsOn: (row.starts_on as string | null) ?? null,
    endsOn: (row.ends_on as string | null) ?? null,
    isActive: row.is_active as boolean,
    sortOrder: row.sort_order as number,
  };
}

function mapInternship(row: Record<string, unknown>): TwofasInternship {
  return {
    id: row.id as string,
    slug: (row.slug as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    department: (row.department as string | null) ?? null,
    deadline: (row.deadline as string | null) ?? null,
    isOpen: row.is_open as boolean,
    track: (row.track as TwofasTrack | null) ?? null,
    programId: (row.program_id as string | null) ?? null,
    cohortId: (row.cohort_id as string | null) ?? null,
    is2fas: row.is_2fas as boolean,
    requirementsHtml: (row.requirements_html as string | null) ?? null,
    maxApplicants: (row.max_applicants as number | null) ?? null,
  };
}

function mapMentor(row: Record<string, unknown>): TwofasMentor {
  return {
    id: row.id as string,
    userId: (row.user_id as string | null) ?? null,
    fullName: row.full_name as string,
    email: (row.email as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    expertise: (row.expertise as string[]) ?? [],
    isActive: row.is_active as boolean,
  };
}

function mapDocument(row: Record<string, unknown>): TwofasDocument {
  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    userId: row.user_id as string,
    docType: row.doc_type as TwofasDocumentType,
    filePath: row.file_path as string,
    label: (row.label as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapApplicationRow(
  row: Record<string, unknown>,
  extras?: {
    internship?: TwofasInternship | null;
    cohort?: TwofasCohort | null;
    profile?: { full_name: string | null; email: string | null } | null;
  },
): TwofasApplication {
  const institution = row.institutions as { name: string } | null;

  return {
    id: row.id as string,
    internshipId: row.internship_id as string,
    userId: row.user_id as string,
    status: row.status as ApplicationStatus,
    coverLetter: (row.cover_letter as string | null) ?? null,
    resumeUrl: (row.resume_url as string | null) ?? null,
    cohortId: (row.cohort_id as string | null) ?? null,
    track: (row.track as TwofasTrack | null) ?? null,
    schoolName: (row.school_name as string | null) ?? null,
    major: (row.major as string | null) ?? null,
    graduationYear: (row.graduation_year as number | null) ?? null,
    institutionId: (row.institution_id as string | null) ?? null,
    institutionType: (row.institution_type as InstitutionType | null) ?? null,
    is1890LandGrant: (row.is_1890_land_grant as boolean | null) ?? null,
    academicLevel: (row.academic_level as AcademicLevel | null) ?? null,
    institutionName: institution?.name ?? null,
    emergencyContact: (row.emergency_contact as Record<string, unknown>) ?? {},
    submittedAt: (row.submitted_at as string | null) ?? null,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    reviewedBy: (row.reviewed_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    internship: extras?.internship ?? null,
    cohort: extras?.cohort ?? null,
    applicantName: extras?.profile?.full_name ?? null,
    applicantEmail: extras?.profile?.email ?? null,
  };
}

async function fetchInternshipMap(ids: string[]) {
  if (ids.length === 0) return new Map<string, TwofasInternship>();
  const { data, error } = await supabase.from("internships").select(internshipSelect).in("id", ids);
  if (error) throw error;
  return new Map(
    (data ?? []).map((row) => [row.id, mapInternship(row as Record<string, unknown>)]),
  );
}

async function fetchCohortMap(ids: string[]) {
  if (ids.length === 0) return new Map<string, TwofasCohort>();
  const { data, error } = await supabase.from("twofas_cohorts").select(cohortSelect).in("id", ids);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, mapCohort(row as Record<string, unknown>)]));
}

async function seedStudentMilestonesForApplication(applicationId: string, cohortId: string) {
  const { data: existing, error: existingError } = await supabase
    .from("twofas_student_milestones")
    .select("id")
    .eq("application_id", applicationId)
    .limit(1);
  if (existingError) throw existingError;
  if ((existing ?? []).length > 0) return;

  const { data: templates, error: templateError } = await supabase
    .from("twofas_cohort_milestones")
    .select("id")
    .eq("cohort_id", cohortId)
    .order("sort_order");
  if (templateError) throw templateError;
  if (!templates?.length) return;

  const { error: insertError } = await supabase.from("twofas_student_milestones").insert(
    templates.map((template) => ({
      application_id: applicationId,
      milestone_id: template.id,
      status: "pending" as MilestoneStatus,
    })),
  );
  if (insertError) throw insertError;
}

export async function list2FASCohorts(options?: { activeOnly?: boolean; track?: TwofasTrack }) {
  let query = supabase
    .from("twofas_cohorts")
    .select(cohortSelect)
    .order("year", { ascending: false })
    .order("sort_order");
  if (options?.activeOnly !== false) query = query.eq("is_active", true);
  if (options?.track) query = query.eq("track", options.track);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapCohort(row as Record<string, unknown>));
}

export async function list2FASInternships(options?: { openOnly?: boolean }) {
  let query = supabase
    .from("internships")
    .select(internshipSelect)
    .eq("is_2fas", true)
    .order("deadline", { ascending: true, nullsFirst: false });

  if (options?.openOnly !== false) query = query.eq("is_open", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapInternship(row as Record<string, unknown>));
}

export async function get2FASApplication(applicationId: string): Promise<TwofasApplication | null> {
  const { data: row, error } = await supabase
    .from("internship_applications")
    .select(
      `${applicationSelect}, profiles ( full_name, email ), internships ( ${internshipSelect} ), twofas_cohorts ( ${cohortSelect} )`,
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error) throw error;
  if (!row) return null;

  const internshipRaw = row.internships as Record<string, unknown> | null;
  const cohortRaw = row.twofas_cohorts as Record<string, unknown> | null;
  const profile = row.profiles as { full_name: string | null; email: string | null } | null;

  const application = mapApplicationRow(row as Record<string, unknown>, {
    internship: internshipRaw ? mapInternship(internshipRaw) : null,
    cohort: cohortRaw ? mapCohort(cohortRaw) : null,
    profile,
  });

  const [mentorRes, milestones, documents] = await Promise.all([
    supabase
      .from("twofas_mentor_assignments")
      .select(
        "id, application_id, mentor_id, assigned_at, assigned_by, notes, twofas_mentors ( id, user_id, full_name, email, bio, expertise, is_active )",
      )
      .eq("application_id", applicationId)
      .maybeSingle(),
    list2FASMilestones(applicationId),
    supabase
      .from("twofas_documents")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false }),
  ]);

  if (mentorRes.error) throw mentorRes.error;
  if (documents.error) throw documents.error;

  if (mentorRes.data) {
    const mentorRow = mentorRes.data.twofas_mentors as Record<string, unknown> | null;
    application.mentorAssignment = {
      id: mentorRes.data.id,
      applicationId: mentorRes.data.application_id,
      mentorId: mentorRes.data.mentor_id,
      assignedAt: mentorRes.data.assigned_at,
      assignedBy: mentorRes.data.assigned_by,
      notes: mentorRes.data.notes,
      mentor: mentorRow ? mapMentor(mentorRow) : undefined,
    };
  }

  application.milestones = milestones;
  application.documents = (documents.data ?? []).map((doc) =>
    mapDocument(doc as Record<string, unknown>),
  );
  return application;
}

export async function submit2FASApplication(input: Submit2FASApplicationInput) {
  return submitNativeInternshipApplication(input);
}

export async function submitInternshipApplication(input: SubmitInternshipApplicationInput) {
  return submitNativeInternshipApplication(input);
}

async function submitNativeInternshipApplication(input: SubmitInternshipApplicationInput) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || auth.user.id !== input.userId) {
    throw new Error("Sign in is required to apply.");
  }

  const { data, error } = await supabase.rpc("submit_internship_application", {
    p_application: {
      internship_id: input.internshipId,
      cover_letter: input.coverLetter || null,
      resume_url: input.resumeUrl || null,
      school_name: input.schoolName || null,
      major: input.major || null,
      graduation_year: input.graduationYear ?? null,
      institution_id: input.institutionId ?? null,
      institution_type: input.institutionType ?? null,
      is_1890_land_grant: input.is1890LandGrant ?? null,
      academic_level: input.academicLevel ?? null,
      emergency_contact: input.emergencyContact ?? {},
    },
  });

  if (error) throw error;
  if (!data) throw new Error("Application was not created.");
  return data as string;
}

export async function listMy2FASApplications(userId: string) {
  const { data, error } = await supabase
    .from("internship_applications")
    .select(`${applicationSelect}, internships!inner ( ${internshipSelect} )`)
    .eq("user_id", userId)
    .eq("internships.is_2fas", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const cohortIds = [
    ...new Set((data ?? []).map((row) => row.cohort_id).filter(Boolean)),
  ] as string[];
  const cohortMap = await fetchCohortMap(cohortIds);

  return (data ?? []).map((row) => {
    const internshipRaw = row.internships as Record<string, unknown>;
    return mapApplicationRow(row as Record<string, unknown>, {
      internship: mapInternship(internshipRaw),
      cohort: row.cohort_id ? (cohortMap.get(row.cohort_id) ?? null) : null,
    });
  });
}

export async function listAdmin2FASApplications(options?: {
  status?: ApplicationStatus;
  track?: TwofasTrack;
  cohortId?: string;
}) {
  let query = supabase
    .from("internship_applications")
    .select(
      `${applicationSelect}, profiles ( full_name, email ), internships!inner ( ${internshipSelect} )`,
    )
    .eq("internships.is_2fas", true)
    .order("created_at", { ascending: false });

  if (options?.status) query = query.eq("status", options.status);
  if (options?.track) query = query.eq("track", options.track);
  if (options?.cohortId) query = query.eq("cohort_id", options.cohortId);

  const { data, error } = await query;
  if (error) throw error;

  const cohortIds = [
    ...new Set((data ?? []).map((row) => row.cohort_id).filter(Boolean)),
  ] as string[];
  const cohortMap = await fetchCohortMap(cohortIds);

  return (data ?? []).map((row) => {
    const internshipRaw = row.internships as Record<string, unknown>;
    const profile = row.profiles as { full_name: string | null; email: string | null } | null;
    return mapApplicationRow(row as Record<string, unknown>, {
      internship: mapInternship(internshipRaw),
      cohort: row.cohort_id ? (cohortMap.get(row.cohort_id) ?? null) : null,
      profile,
    });
  });
}

export async function update2FASApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  reviewedBy?: string | null,
) {
  const { data: existing, error: existingError } = await supabase
    .from("internship_applications")
    .select("id, cohort_id, status")
    .eq("id", applicationId)
    .single();
  if (existingError) throw existingError;

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("internship_applications")
    .update({
      status,
      reviewed_at: now,
      reviewed_by: reviewedBy ?? null,
    })
    .eq("id", applicationId);

  if (error) throw error;

  if ((status === "accepted" || status === "active") && existing.cohort_id) {
    await seedStudentMilestonesForApplication(applicationId, existing.cohort_id);
  }
}

export async function assign2FASMentor(
  applicationId: string,
  mentorId: string,
  assignedBy?: string | null,
) {
  const { error } = await supabase.from("twofas_mentor_assignments").upsert(
    {
      application_id: applicationId,
      mentor_id: mentorId,
      assigned_by: assignedBy ?? null,
      assigned_at: new Date().toISOString(),
    },
    { onConflict: "application_id" },
  );
  if (error) throw error;
}

export async function list2FASMilestones(applicationId: string): Promise<TwofasStudentMilestone[]> {
  const { data, error } = await supabase
    .from("twofas_student_milestones")
    .select(
      "id, application_id, milestone_id, status, completed_at, notes, twofas_cohort_milestones ( title, description, due_offset_days, is_required, sort_order )",
    )
    .eq("application_id", applicationId)
    .order("created_at");

  if (error) throw error;

  const mapped = (data ?? []).map((row) => {
    const template = row.twofas_cohort_milestones as {
      title: string;
      description: string | null;
      due_offset_days: number | null;
      is_required: boolean;
      sort_order: number;
    };
    return {
      id: row.id,
      applicationId: row.application_id,
      milestoneId: row.milestone_id,
      status: row.status as MilestoneStatus,
      completedAt: row.completed_at,
      notes: row.notes,
      title: template.title,
      description: template.description,
      dueOffsetDays: template.due_offset_days,
      isRequired: template.is_required,
      sortOrder: template.sort_order,
    };
  });

  return mapped.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function update2FASMilestoneStatus(
  studentMilestoneId: string,
  status: MilestoneStatus,
  notes?: string | null,
) {
  const completedAt = status === "completed" ? new Date().toISOString() : null;
  const { error } = await supabase
    .from("twofas_student_milestones")
    .update({
      status,
      notes: notes ?? null,
      completed_at: completedAt,
    })
    .eq("id", studentMilestoneId);

  if (error) throw error;
}

export async function upload2FASDocument(
  file: File,
  applicationId: string,
  userId: string,
  docType: TwofasDocumentType,
  label?: string | null,
) {
  const { data: application, error: appError } = await supabase
    .from("internship_applications")
    .select("id, user_id")
    .eq("id", applicationId)
    .single();
  if (appError) throw appError;
  if (application.user_id !== userId)
    throw new Error("You can only upload documents to your own application.");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${userId}/${applicationId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(TWOFAS_DOCUMENTS_BUCKET)
    .upload(filePath, file, {
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("twofas_documents")
    .insert({
      application_id: applicationId,
      user_id: userId,
      doc_type: docType,
      file_path: filePath,
      label: label || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapDocument(data as Record<string, unknown>);
}

export function get2FASDocumentPublicUrl(filePath: string) {
  const { data } = supabase.storage.from(TWOFAS_DOCUMENTS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function get2FASDocumentSignedUrl(filePath: string, expiresIn = 300) {
  const { data, error } = await supabase.storage
    .from(TWOFAS_DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function get2FASResumeSignedUrl(path: string, expiresIn = 300) {
  const { data, error } = await supabase.storage
    .from(RESUMES_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
