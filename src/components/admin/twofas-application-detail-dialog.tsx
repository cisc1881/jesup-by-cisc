import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TwofasApplicationStatusBadge } from "@/components/admin/twofas-application-status-badge";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  TWOFAS_TRACK_LABELS,
  get2FASApplication,
  get2FASDocumentSignedUrl,
  get2FASResumeSignedUrl,
  update2FASApplicationStatus,
  type ApplicationStatus,
} from "@/lib/twofas";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";

type Props = {
  applicationId: string | null;
  adminUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatEmergencyContact(contact: Record<string, unknown>) {
  const entries = Object.entries(contact).filter(([, v]) => v != null && String(v).trim() !== "");
  if (entries.length === 0) return "—";
  return entries.map(([key, value]) => `${key.replace(/_/g, " ")}: ${String(value)}`).join(" · ");
}

export function TwofasApplicationDetailDialog({
  applicationId,
  adminUserId,
  open,
  onOpenChange,
}: Props) {
  const qc = useQueryClient();
  const [statusDraft, setStatusDraft] = useState<ApplicationStatus>("pending");
  const [saving, setSaving] = useState(false);

  const { data: application, isLoading } = useQuery({
    queryKey: ["admin-2fas-application", applicationId],
    enabled: open && !!applicationId,
    queryFn: () => get2FASApplication(applicationId!),
  });

  useEffect(() => {
    if (application?.status) setStatusDraft(application.status);
  }, [application?.status, applicationId]);

  async function saveStatus() {
    if (!applicationId || !application) return;
    if (statusDraft === application.status) return;
    setSaving(true);
    try {
      await update2FASApplicationStatus(applicationId, statusDraft, adminUserId);
      toast.success("Application status updated");
      await qc.invalidateQueries({ queryKey: ["admin-2fas-applications"] });
      await qc.invalidateQueries({ queryKey: ["admin-2fas-application", applicationId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setSaving(false);
    }
  }

  async function openDocument(path: string, bucket: "twofas" | "resume") {
    try {
      const url =
        bucket === "twofas"
          ? await get2FASDocumentSignedUrl(path)
          : await get2FASResumeSignedUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open document");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>2FAS application review</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading application…
          </div>
        )}

        {!isLoading && !application && (
          <p className="py-8 text-center text-muted-foreground">Application not found.</p>
        )}

        {application && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{application.applicantName || "—"}</div>
                <div className="text-sm text-muted-foreground">{application.applicantEmail || "—"}</div>
              </div>
              <TwofasApplicationStatusBadge status={application.status} />
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Submitted</span>
                <div>{fmtDateTime(application.submittedAt ?? application.createdAt)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Last reviewed</span>
                <div>{application.reviewedAt ? fmtDateTime(application.reviewedAt) : "—"}</div>
              </div>
            </div>

            <Separator />

            <section className="space-y-2">
              <h3 className="font-semibold">Opportunity</h3>
              <div className="text-sm">
                <div className="font-medium">{application.internship?.title ?? "—"}</div>
                <div className="text-muted-foreground">
                  {application.track
                    ? TWOFAS_TRACK_LABELS[application.track]
                    : application.internship?.track
                      ? TWOFAS_TRACK_LABELS[application.internship.track]
                      : "—"}
                  {application.cohort ? ` · ${application.cohort.name}` : ""}
                </div>
                {application.internship?.deadline && (
                  <div className="text-muted-foreground">
                    Deadline {fmtDate(application.internship.deadline)}
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold">Academic profile</h3>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <span className="text-muted-foreground">School</span>
                  <div>{application.schoolName || "—"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Major</span>
                  <div>{application.major || "—"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Graduation</span>
                  <div>{application.graduationYear ?? "—"}</div>
                </div>
              </div>
            </section>

            {application.coverLetter && (
              <section className="space-y-2">
                <h3 className="font-semibold">Cover letter</h3>
                <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
                  {application.coverLetter}
                </p>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="font-semibold">Emergency contact</h3>
              <p className="text-sm">{formatEmergencyContact(application.emergencyContact)}</p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold">Documents</h3>
              <div className="space-y-2">
                {application.resumeUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openDocument(application.resumeUrl!, "resume")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Resume
                  </Button>
                )}
                {(application.documents ?? []).map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openDocument(doc.filePath, "twofas")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {doc.label || doc.docType}
                    </Button>
                    <span className="text-xs text-muted-foreground">{fmtDate(doc.createdAt)}</span>
                  </div>
                ))}
                {!application.resumeUrl && (application.documents ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No documents uploaded.</p>
                )}
              </div>
            </section>

            {application.mentorAssignment?.mentor && (
              <section className="space-y-2">
                <h3 className="font-semibold">Assigned mentor</h3>
                <div className="text-sm">
                  <div className="font-medium">{application.mentorAssignment.mentor.fullName}</div>
                  {application.mentorAssignment.mentor.email && (
                    <div className="text-muted-foreground">{application.mentorAssignment.mentor.email}</div>
                  )}
                </div>
              </section>
            )}

            {(application.status === "accepted" || application.status === "active") &&
              (application.milestones?.length ?? 0) > 0 && (
                <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                  {application.milestones!.length} cohort milestone
                  {application.milestones!.length === 1 ? "" : "s"} tracked for this student.
                </p>
              )}

            <Separator />

            <section className="space-y-3">
              <h3 className="font-semibold">Update status</h3>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px] flex-1 space-y-1">
                  <Label>Status</Label>
                  <Select value={statusDraft} onValueChange={(v) => setStatusDraft(v as ApplicationStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLICATION_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {APPLICATION_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  className="bg-primary hover:bg-primary/90"
                  disabled={saving || statusDraft === application.status}
                  onClick={saveStatus}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save status"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Accepting or activating an application with a cohort will seed milestone tracking automatically.
              </p>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
