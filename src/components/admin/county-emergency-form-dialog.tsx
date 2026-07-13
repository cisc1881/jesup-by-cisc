import { useEffect, useState } from "react";
import type { CountyEmergencyFormData } from "@/lib/weather/county-directory-types";
import {
  emptyCountyEmergencyForm,
  fetchCountyEmergencyContact,
  previewCountyEmergencyCard,
  saveCountyEmergencyContact,
} from "@/lib/county-emergency-contacts";
import { CountyPreparednessCard } from "@/components/weather/county-preparedness-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type CountyEmergencyFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId: string | null;
  onSaved: () => void;
};

export function CountyEmergencyFormDialog({
  open,
  onOpenChange,
  recordId,
  onSaved,
}: CountyEmergencyFormDialogProps) {
  const [form, setForm] = useState<CountyEmergencyFormData>(emptyCountyEmergencyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!recordId) {
      setForm(emptyCountyEmergencyForm());
      return;
    }

    fetchCountyEmergencyContact(recordId)
      .then((record) => {
        setForm({
          countyName: record.countyName,
          stateName: record.stateName,
          stateCode: record.stateCode,
          agencyName: record.agencyName,
          primaryPhone: record.primaryPhone ?? "",
          alternatePhone: record.alternatePhone ?? "",
          websiteUrl: record.websiteUrl ?? "",
          alertSignupUrl: record.alertSignupUrl ?? "",
          shelterInfoUrl: record.shelterInfoUrl ?? "",
          weatherRadioGuidance: record.weatherRadioGuidance ?? "",
          emergencyKitGuidance: record.emergencyKitGuidance ?? "",
          householdStormProtocol: record.householdStormProtocol ?? "",
          sourceName: record.sourceName ?? "",
          sourceUrl: record.sourceUrl ?? "",
          verifiedDate: record.verifiedDate ?? "",
          verificationStatus: record.verificationStatus,
          notes: record.notes ?? "",
          isActive: record.isActive,
        });
      })
      .catch((error) => toast.error(error.message));
  }, [open, recordId]);

  async function handleSave() {
    setSaving(true);
    try {
      if (form.verificationStatus === "verified" && !form.primaryPhone.trim()) {
        toast.error("Verified records require a primary phone number.");
        return;
      }
      await saveCountyEmergencyContact(recordId, form);
      toast.success(recordId ? "County record updated" : "County record created");
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save county record");
    } finally {
      setSaving(false);
    }
  }

  const previewRecord = {
    id: recordId ?? "preview",
    countyName: form.countyName || "County",
    stateName: form.stateName,
    stateCode: form.stateCode,
    agencyName: form.agencyName || "Agency",
    primaryPhone: form.primaryPhone || null,
    alternatePhone: form.alternatePhone || null,
    websiteUrl: form.websiteUrl || null,
    alertSignupUrl: form.alertSignupUrl || null,
    shelterInfoUrl: form.shelterInfoUrl || null,
    weatherRadioGuidance: form.weatherRadioGuidance || null,
    emergencyKitGuidance: form.emergencyKitGuidance || null,
    householdStormProtocol: form.householdStormProtocol || null,
    sourceName: form.sourceName || null,
    sourceUrl: form.sourceUrl || null,
    verifiedDate: form.verifiedDate || null,
    verificationStatus: form.verificationStatus,
    notes: form.notes || null,
    isActive: form.isActive,
    archivedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recordId ? "Edit county emergency contact" : "New county emergency contact"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="county-name">County</Label>
                <Input id="county-name" value={form.countyName} onChange={(e) => setForm({ ...form, countyName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state-code">State code</Label>
                <Input id="state-code" value={form.stateCode} onChange={(e) => setForm({ ...form, stateCode: e.target.value.toUpperCase() })} maxLength={2} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state-name">State name</Label>
              <Input id="state-name" value={form.stateName} onChange={(e) => setForm({ ...form, stateName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="agency-name">Agency name</Label>
              <Input id="agency-name" value={form.agencyName} onChange={(e) => setForm({ ...form, agencyName: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="primary-phone">Primary phone</Label>
                <Input id="primary-phone" value={form.primaryPhone} onChange={(e) => setForm({ ...form, primaryPhone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alternate-phone">Alternate phone</Label>
                <Input id="alternate-phone" value={form.alternatePhone} onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Verification status</Label>
              <Select value={form.verificationStatus} onValueChange={(value: CountyEmergencyFormData["verificationStatus"]) => setForm({ ...form, verificationStatus: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="verified-date">Verification date</Label>
              <Input id="verified-date" type="date" value={form.verifiedDate} onChange={(e) => setForm({ ...form, verifiedDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source-name">Source name</Label>
              <Input id="source-name" value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source-url">Source URL</Label>
              <Input id="source-url" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weather-radio">Weather radio guidance</Label>
              <Textarea id="weather-radio" value={form.weatherRadioGuidance} onChange={(e) => setForm({ ...form, weatherRadioGuidance: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kit-guidance">Emergency kit guidance</Label>
              <Textarea id="kit-guidance" value={form.emergencyKitGuidance} onChange={(e) => setForm({ ...form, emergencyKitGuidance: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="storm-protocol">Household storm protocol</Label>
              <Textarea id="storm-protocol" value={form.householdStormProtocol} onChange={(e) => setForm({ ...form, householdStormProtocol: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} id="is-active" />
              <Label htmlFor="is-active">Active record</Label>
            </div>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save county record"}
            </Button>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">Public card preview</p>
            <CountyPreparednessCard preparedness={previewCountyEmergencyCard(previewRecord)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
