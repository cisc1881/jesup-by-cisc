import { supabase } from "@/integrations/supabase/client";
import type { AcademicLevel, InstitutionType } from "@/lib/institutions";

export type UserProfile = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  affiliation: string | null;
  institutionId: string | null;
  institutionType: InstitutionType | null;
  schoolName: string | null;
  is1890LandGrant: boolean | null;
  academicLevel: AcademicLevel | null;
  majorOrInterest: string | null;
  expectedGraduationYear: number | null;
};

export type ProfileInstitutionInput = {
  institutionId?: string | null;
  institutionType?: InstitutionType | null;
  schoolName?: string | null;
  is1890LandGrant?: boolean | null;
  academicLevel?: AcademicLevel | null;
  majorOrInterest?: string | null;
  expectedGraduationYear?: number | null;
};

const profileSelect = `
  id,
  full_name,
  email,
  phone,
  affiliation,
  institution_id,
  institution_type,
  school_name,
  is_1890_land_grant,
  academic_level,
  major_or_interest,
  expected_graduation_year
`;

function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    fullName: (row.full_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    affiliation: (row.affiliation as string | null) ?? null,
    institutionId: (row.institution_id as string | null) ?? null,
    institutionType: (row.institution_type as InstitutionType | null) ?? null,
    schoolName: (row.school_name as string | null) ?? null,
    is1890LandGrant: (row.is_1890_land_grant as boolean | null) ?? null,
    academicLevel: (row.academic_level as AcademicLevel | null) ?? null,
    majorOrInterest: (row.major_or_interest as string | null) ?? null,
    expectedGraduationYear: (row.expected_graduation_year as number | null) ?? null,
  };
}

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select(profileSelect).eq("id", userId).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data as Record<string, unknown>) : null;
}

export async function updateMyProfileInstitution(userId: string, input: ProfileInstitutionInput) {
  const payload: Record<string, unknown> = {
    institution_id: input.institutionId ?? null,
    institution_type: input.institutionType ?? null,
    school_name: input.schoolName?.trim() || null,
    is_1890_land_grant: input.is1890LandGrant ?? null,
    academic_level: input.academicLevel ?? null,
    major_or_interest: input.majorOrInterest?.trim() || null,
    expected_graduation_year: input.expectedGraduationYear ?? null,
  };

  const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
  if (error) throw error;
}
