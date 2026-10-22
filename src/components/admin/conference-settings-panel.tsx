import type { EventFormData } from "@/lib/events";
import { CONFERENCE_SECTIONS, sectionSettings } from "@/lib/conference";
import { saveConferenceSettings } from "@/lib/conference-data";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function ConferenceSettingsPanel({ eventId, form, onMetadata }: { eventId: string | null; form: EventFormData; onMetadata: (metadata: Record<string, unknown>) => void }) {
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const metadata = form.metadata;
  const settings = sectionSettings(metadata);
  const update = (key: string, value: unknown) => onMetadata({ ...metadata, [key]: value });
  async function save() {
    if (!eventId) return;
    setSaving(true);
    try { await saveConferenceSettings(eventId, metadata); await qc.invalidateQueries(); toast.success("Conference settings saved"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not save conference settings"); }
    finally { setSaving(false); }
  }
  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-4"><Label htmlFor="conference-shell">Conference shell</Label><Switch id="conference-shell" checked={metadata.conference_shell === true} onCheckedChange={value => update("conference_shell", value)} /></div>
    <div><Label htmlFor="conference-theme">Conference theme</Label><Input id="conference-theme" value={String(metadata.conference_theme ?? "")} onChange={e => update("conference_theme", e.target.value)} /></div>
    <div><Label>Event appearance</Label><Select value={metadata.theme_preset === "tuskegee" ? "tuskegee" : "network"} onValueChange={value => update("theme_preset", value)}><SelectTrigger aria-label="Event appearance"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tuskegee">Tuskegee crimson & gold</SelectItem><SelectItem value="network">JESUP network</SelectItem></SelectContent></Select></div>
    <div className="grid gap-3 sm:grid-cols-2">{[ ["map_url","Campus map URL"], ["parking_url","Parking information URL"] ].map(([key,label]) => <div key={key}><Label htmlFor={key}>{label}</Label><Input id={key} type="url" value={String(metadata[key] ?? "")} onChange={e => update(key,e.target.value)} /></div>)}</div>
    <div className="divide-y border-y">{CONFERENCE_SECTIONS.map(([id,label]) => <div key={id} className="flex min-h-12 items-center justify-between gap-3 py-2"><Label htmlFor={`section-${id}`}>{label}</Label><Switch id={`section-${id}`} disabled={id === "home"} checked={id === "home" || settings[id] === true} onCheckedChange={value => update("sections", { ...settings, [id]:value })} /></div>)}</div>
    <div className="space-y-3">{[["community_enabled","Enable registered-attendee community"],["attendee_workspace_enabled","Enable My Event"],["wallet_enabled","Enable issued-credential wallet"]].map(([key,label]) => <div key={key} className="flex items-center justify-between gap-3"><Label htmlFor={key}>{label}</Label><Switch id={key} checked={metadata[key] === true} onCheckedChange={value => update(key,value)} /></div>)}</div>
    <p className="text-sm text-muted-foreground">Sections remain hidden until enabled and configured. Tickets need open registration or confirmed Eventbrite settings; schedule and speakers need entries. Square payments remain disabled.</p>
    {eventId && <Button type="button" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save conference settings only"}</Button>}
  </div>;
}