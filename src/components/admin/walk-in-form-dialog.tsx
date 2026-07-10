import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ATTENDANCE_STATUS_LABELS,
  addWalkIn,
  type AttendanceStatus,
  type WalkInInput,
} from "@/lib/attendance";
import { DemographicForm } from "@/components/demographics";
import {
  buildEmptyDemographicForm,
  hasAnyDemographicField,
  submitAdminWalkInDemographics,
  type DemographicFormData,
} from "@/lib/demographics";
import { eventDemographicAggregatesQueryKey } from "@/lib/query-config";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { INQUIRY_US_STATES } from "@/lib/inquiries";
import { ChevronDown, Loader2 } from "lucide-react";

type WalkInFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  adminUserId?: string | null;
  onSaved: () => void;
};

const WALK_IN_TYPES: AttendanceStatus[] = ["attended", "virtual"];

export function WalkInFormDialog({
  open,
  onOpenChange,
  eventId,
  adminUserId,
  onSaved,
}: WalkInFormDialogProps) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [showDemographics, setShowDemographics] = useState(false);
  const [demographicForm, setDemographicForm] = useState<DemographicFormData>(buildEmptyDemographicForm());
  const [form, setForm] = useState<Omit<WalkInInput, "eventId" | "adminUserId">>({
    fullName: "",
    email: "",
    phone: "",
    organizationOrSchool: "",
    county: "",
    state: "",
    attendanceType: "attended",
    notes: "",
  });

  function resetForm() {
    setForm({
      fullName: "",
      email: "",
      phone: "",
      organizationOrSchool: "",
      county: "",
      state: "",
      attendanceType: "attended",
      notes: "",
    });
    setDemographicForm(buildEmptyDemographicForm());
    setShowDemographics(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }
    setSaving(true);
    try {
      const result = await addWalkIn({
        eventId,
        adminUserId,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        organizationOrSchool: form.organizationOrSchool,
        county: form.county,
        state: form.state,
        attendanceType: form.attendanceType,
        notes: form.notes,
      });

      if (hasAnyDemographicField(demographicForm)) {
        try {
          await submitAdminWalkInDemographics(result.walkInId, demographicForm);
        } catch (demoErr) {
          toast.error(
            demoErr instanceof Error
              ? `Walk-in saved, but demographics failed: ${demoErr.message}`
              : "Walk-in saved, but demographics could not be saved",
          );
          onSaved();
          resetForm();
          onOpenChange(false);
          return;
        }
      }

      toast.success("Walk-in added");
      void qc.invalidateQueries({ queryKey: eventDemographicAggregatesQueryKey(eventId) });
      resetForm();
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add walk-in");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add walk-in</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="walk-in-name">Full name *</Label>
            <Input
              id="walk-in-name"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="walk-in-email">Email</Label>
              <Input
                id="walk-in-email"
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="walk-in-phone">Phone</Label>
              <Input
                id="walk-in-phone"
                value={form.phone ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="walk-in-org">Organization or school</Label>
            <Input
              id="walk-in-org"
              value={form.organizationOrSchool ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, organizationOrSchool: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="walk-in-county">County</Label>
              <Input
                id="walk-in-county"
                value={form.county ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, county: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="walk-in-state">State</Label>
              <Select
                value={form.state || "none"}
                onValueChange={(v) => setForm((prev) => ({ ...prev, state: v === "none" ? "" : v }))}
              >
                <SelectTrigger id="walk-in-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {INQUIRY_US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="walk-in-type">Attendance type</Label>
            <Select
              value={form.attendanceType ?? "attended"}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, attendanceType: v as AttendanceStatus }))
              }
            >
              <SelectTrigger id="walk-in-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WALK_IN_TYPES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {ATTENDANCE_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="walk-in-notes">Note (optional)</Label>
            <Textarea
              id="walk-in-notes"
              value={form.notes ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>
          <Collapsible open={showDemographics} onOpenChange={setShowDemographics}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between">
                Optional demographic information
                <ChevronDown className={`h-4 w-4 transition-transform ${showDemographics ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <DemographicForm
                value={demographicForm}
                onChange={setDemographicForm}
                idPrefix="walk-in-demo"
              />
            </CollapsibleContent>
          </Collapsible>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save walk-in
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
