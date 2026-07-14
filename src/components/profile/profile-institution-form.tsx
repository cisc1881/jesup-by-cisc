import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingState, QueryErrorState } from "@/components/design-system";
import { InstitutionFields } from "@/components/institutions";
import { StudentAcademicFields, type StudentAcademicValue } from "@/components/institutions/student-academic-fields";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, updateMyProfileInstitution } from "@/lib/profile";
import {
  listInstitutions,
  resolveInstitutionFields,
  type InstitutionSelection,
} from "@/lib/institutions";
import { toast } from "sonner";

const emptyInstitution: InstitutionSelection = {
  institutionId: "",
  institutionType: "",
  schoolName: "",
};

const emptyAcademic: StudentAcademicValue = {
  academicLevel: "",
  major: "",
  graduationYear: "",
};

export function ProfileInstitutionForm() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [institution, setInstitution] = useState<InstitutionSelection>(emptyInstitution);
  const [academic, setAcademic] = useState<StudentAcademicValue>(emptyAcademic);
  const [busy, setBusy] = useState(false);

  const { data: institutions = [], isLoading: institutionsLoading } = useQuery({
    queryKey: ["institutions", "profile"],
    queryFn: () => listInstitutions({ activeOnly: true, includeOther: true }),
  });

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch,
  } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: () => getMyProfile(user!.id),
  });

  useEffect(() => {
    if (!profile) return;
    setInstitution({
      institutionId: profile.institutionId ?? "",
      institutionType: profile.institutionType ?? "",
      schoolName: profile.schoolName ?? "",
    });
    setAcademic({
      academicLevel: profile.academicLevel ?? "",
      major: profile.majorOrInterest ?? "",
      graduationYear: profile.expectedGraduationYear ? String(profile.expectedGraduationYear) : "",
    });
  }, [profile]);

  const resolvedInstitution = useMemo(
    () => resolveInstitutionFields(institutions, institution),
    [institutions, institution],
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || busy) return;

    setBusy(true);
    try {
      const graduationYear = academic.graduationYear.trim()
        ? Number.parseInt(academic.graduationYear, 10)
        : null;

      await updateMyProfileInstitution(user.id, {
        institutionId: resolvedInstitution.institutionId,
        institutionType: resolvedInstitution.institutionType,
        schoolName: resolvedInstitution.schoolName,
        is1890LandGrant: resolvedInstitution.institutionId ? resolvedInstitution.is1890LandGrant : null,
        academicLevel: academic.academicLevel || null,
        majorOrInterest: academic.major.trim() || null,
        expectedGraduationYear: Number.isFinite(graduationYear) ? graduationYear : null,
      });

      await qc.invalidateQueries({ queryKey: ["my-profile", user.id] });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save profile.");
    } finally {
      setBusy(false);
    }
  }

  if (profileLoading || institutionsLoading) {
    return <LoadingState label="Loading profile…" />;
  }

  if (profileError) {
    return <QueryErrorState title="Couldn't load profile" onRetry={() => refetch()} />;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6" aria-busy={busy}>
      <p className="text-sm text-muted-foreground">
        All fields are optional. Share your school or institution to help us match you with programs and opportunities.
      </p>

      <InstitutionFields
        institutions={institutions}
        value={institution}
        onChange={setInstitution}
        disabled={busy}
      />

      <StudentAcademicFields value={academic} onChange={setAcademic} disabled={busy} />

      <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={busy}>
        {busy ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
