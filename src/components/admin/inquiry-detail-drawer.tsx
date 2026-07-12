import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { fmtDateTime } from "@/lib/format";
import {
  addInquiryNote,
  formatInquiryReference,
  INQUIRY_STATUS_LABELS,
  INQUIRY_STATUSES,
  INQUIRY_TYPE_LABELS,
  listInquiryNotes,
  updateInquiryStatus,
  type AdminStaffMember,
  type Inquiry,
  type InquiryStatus,
} from "@/lib/inquiries";
import { INSTITUTION_TYPE_LABELS } from "@/lib/institutions";
import { toast } from "sonner";
import { X } from "lucide-react";

function statusVariant(status: InquiryStatus): "default" | "secondary" | "outline" | "destructive" {
  if (status === "new") return "default";
  if (status === "closed" || status === "resolved") return "secondary";
  return "outline";
}

export function InquiryDetailDrawer({
  inquiry,
  open,
  onOpenChange,
  staff,
}: {
  inquiry: Inquiry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: AdminStaffMember[];
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<InquiryStatus>("new");
  const [assignedTo, setAssignedTo] = useState<string>("none");
  const [noteBody, setNoteBody] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: notes = [] } = useQuery({
    queryKey: ["inquiry-notes", inquiry?.id],
    enabled: open && !!inquiry?.id,
    queryFn: () => listInquiryNotes(inquiry!.id),
  });

  useEffect(() => {
    if (!inquiry) return;
    setStatus(inquiry.status);
    setAssignedTo(inquiry.assignedTo ?? "none");
    setNoteBody("");
  }, [inquiry]);

  async function saveChanges() {
    if (!inquiry) return;
    setSaving(true);
    try {
      await updateInquiryStatus(
        inquiry.id,
        status,
        assignedTo === "none" ? null : assignedTo,
      );
      await qc.invalidateQueries({ queryKey: ["admin-inquiries"] });
      await qc.invalidateQueries({ queryKey: ["command-center-dashboard"] });
      await qc.invalidateQueries({ queryKey: ["command-center-counts"] });
      toast.success("Inquiry updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update inquiry");
    } finally {
      setSaving(false);
    }
  }

  async function submitNote() {
    if (!inquiry || !user || !noteBody.trim()) return;
    const body = noteBody.trim();
    setSaving(true);
    try {
      await addInquiryNote(inquiry.id, user.id, body);
      const refreshed = await listInquiryNotes(inquiry.id);
      const saved = refreshed.some((note) => note.body === body && note.authorId === user.id);
      if (!saved) {
        throw new Error("Note saved but could not be loaded. Confirm admin profile access.");
      }
      setNoteBody("");
      qc.setQueryData(["inquiry-notes", inquiry.id], refreshed);
      toast.success("Note added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setSaving(false);
    }
  }

  if (!inquiry) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <div className="mx-auto w-full max-w-2xl overflow-y-auto px-4 pb-8">
          <DrawerHeader className="px-0 text-left">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DrawerTitle className="font-serif text-2xl">
                  {inquiry.firstName} {inquiry.lastName}
                </DrawerTitle>
                <DrawerDescription>
                  Reference {formatInquiryReference(inquiry.id)} · Submitted {fmtDateTime(inquiry.submittedAt)}
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button size="icon" variant="ghost" aria-label="Close inquiry details">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={statusVariant(inquiry.status)}>{INQUIRY_STATUS_LABELS[inquiry.status]}</Badge>
              <Badge variant="outline">{INQUIRY_TYPE_LABELS[inquiry.inquiryType]}</Badge>
            </div>
          </DrawerHeader>

          <div className="space-y-6">
            <section className="space-y-2 text-sm">
              <h3 className="font-semibold text-foreground">Contact</h3>
              <p>{inquiry.email}</p>
              {inquiry.phone && <p>{inquiry.phone}</p>}
              <p className="text-muted-foreground">Preferred: {inquiry.preferredContact}</p>
            </section>

            <section className="space-y-2 text-sm">
              <h3 className="font-semibold text-foreground">Institution</h3>
              <p>{inquiry.institutionName ?? inquiry.organizationOrSchool ?? "—"}</p>
              {inquiry.institutionType && (
                <p className="text-muted-foreground">{INSTITUTION_TYPE_LABELS[inquiry.institutionType]}</p>
              )}
              {(inquiry.city || inquiry.state || inquiry.county) && (
                <p className="text-muted-foreground">
                  {[inquiry.city, inquiry.county, inquiry.state].filter(Boolean).join(", ")}
                </p>
              )}
            </section>

            {inquiry.programName && (
              <section className="space-y-1 text-sm">
                <h3 className="font-semibold text-foreground">Program of interest</h3>
                <p>{inquiry.programName}</p>
              </section>
            )}

            {inquiry.message && (
              <section className="space-y-2 text-sm">
                <h3 className="font-semibold text-foreground">Message</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">{inquiry.message}</p>
              </section>
            )}

            <section className="space-y-2 text-sm">
              <h3 className="font-semibold text-foreground">Preferences</h3>
              <p>Newsletter opt-in: {inquiry.newsletterOptIn ? "Yes" : "No"}</p>
            </section>

            <Separator />

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inquiry-status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as InquiryStatus)}>
                  <SelectTrigger id="inquiry-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INQUIRY_STATUSES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {INQUIRY_STATUS_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inquiry-assigned">Assigned to</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger id="inquiry-assigned">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.fullName ?? member.email ?? member.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <Button type="button" onClick={() => void saveChanges()} disabled={saving} className="bg-primary hover:bg-primary/90">
              Save status & assignment
            </Button>

            <Separator />

            <section className="space-y-3">
              <h3 className="font-semibold text-foreground">Internal notes</h3>
              {notes.length === 0 && <p className="text-sm text-muted-foreground">No internal notes yet.</p>}
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-sm">
                    <p className="whitespace-pre-wrap">{note.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {note.authorName ?? note.authorEmail ?? "Staff"} · {fmtDateTime(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="inquiry-note">Add note</Label>
                <Textarea
                  id="inquiry-note"
                  rows={3}
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Internal note visible to admins only"
                />
                <Button type="button" variant="outline" onClick={() => void submitNote()} disabled={saving || !noteBody.trim()}>
                  Add note
                </Button>
              </div>
            </section>
          </div>

          <DrawerFooter className="px-0">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
