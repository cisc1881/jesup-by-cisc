import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  EligibilityBanner,
  InstitutionFields,
  StudentAcademicFields,
  type StudentAcademicValue,
} from "@/components/institutions";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile } from "@/lib/profile";
import { triggerEmailDelivery } from "@/lib/email-delivery";
import {
  listInstitutions,
  resolveInstitutionFields,
  resolveSchoolDisplayName,
  type InstitutionSelection,
} from "@/lib/institutions";
import { submitInternshipApplication } from "@/lib/twofas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type InternshipApplicationFormProps = {
  internshipId: string;
  internshipTitle: string;
  is2fas: boolean;
  onSuccess?: () => void;
};

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

export function InternshipApplicationForm({
  internshipId,
  internshipTitle,
  is2fas,
  onSuccess,
}: InternshipApplicationFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cover, setCover] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [institution, setInstitution] = useState<InstitutionSelection>(emptyInstitution);
  const [academic, setAcademic] = useState<StudentAcademicValue>(emptyAcademic);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: institutions = [] } = useQuery({
    queryKey: ["institutions", "application"],
    queryFn: () => listInstitutions({ activeOnly: true, includeOther: true }),
  });

  const { data: profile } = useQuery({
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

  const schoolDisplay = useMemo(
    () =>
      resolveSchoolDisplayName({
        institution: institutions.find((row) => row.id === institution.institutionId) ?? null,
        schoolName: resolvedInstitution.schoolName,
      }),
    [institutions, institution.institutionId, resolvedInstitution.schoolName],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || busy) return;

    setBusy(true);
    let uploadedResumePath: string | null = null;
    try {
      let resumeUrl: string | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const upload = await supabase.storage.from("resumes").upload(path, file);
        if (upload.error) throw upload.error;
        resumeUrl = path;
        uploadedResumePath = path;
      }

      const graduationYear = academic.graduationYear.trim()
        ? Number.parseInt(academic.graduationYear, 10)
        : null;

      await submitInternshipApplication({
        internshipId,
        userId: user.id,
        coverLetter: cover || null,
        resumeUrl,
        schoolName: schoolDisplay === "—" ? null : schoolDisplay,
        major: academic.major.trim() || null,
        graduationYear: Number.isFinite(graduationYear) ? graduationYear : null,
        institutionId: resolvedInstitution.institutionId,
        institutionType: resolvedInstitution.institutionType,
        is1890LandGrant: resolvedInstitution.is1890LandGrant,
        academicLevel: academic.academicLevel || null,
        emergencyContact:
          is2fas && (emergencyName.trim() || emergencyPhone.trim())
            ? {
                name: emergencyName.trim() || null,
                phone: emergencyPhone.trim() || null,
              }
            : {},
      });
      triggerEmailDelivery();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-apps", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["my-internship-application-ids", user.id] }),
        queryClient.invalidateQueries({ queryKey: ["admin-2fas-applications"] }),
      ]);

      toast.success("Application submitted!");
      setCover("");
      setFile(null);
      setEmergencyName("");
      setEmergencyPhone("");
      onSuccess?.();
    } catch (err) {
      if (uploadedResumePath) {
        await supabase.storage.from("resumes").remove([uploadedResumePath]);
      }
      toast.error(err instanceof Error ? err.message : "Unable to submit application.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={busy}>
      {is2fas && <EligibilityBanner />}

      <InstitutionFields
        institutions={institutions}
        value={institution}
        onChange={setInstitution}
        disabled={busy}
      />

      <StudentAcademicFields value={academic} onChange={setAcademic} disabled={busy} />

      <div className="space-y-2">
        <Label htmlFor="cover-letter">Cover letter</Label>
        <Textarea
          id="cover-letter"
          rows={5}
          value={cover}
          onChange={(e) => setCover(e.target.value)}
          disabled={busy}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resume-file">Resume (PDF or Word)</Label>
        <Input
          id="resume-file"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={busy}
        />
      </div>

      {is2fas && (
        <fieldset className="space-y-3 rounded-lg border border-border/60 p-4">
          <legend className="px-1 text-sm font-semibold">Emergency contact (optional)</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergency-name">Contact name</Label>
              <Input
                id="emergency-name"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency-phone">Contact phone</Label>
              <Input
                id="emergency-phone"
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>
        </fieldset>
      )}

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={busy}>
        {busy ? "Submitting…" : `Submit application · ${internshipTitle}`}
      </Button>
    </form>
  );
}
