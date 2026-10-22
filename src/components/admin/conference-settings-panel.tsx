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
import { Plus, Trash2 } from "lucide-react";

export function ConferenceSettingsPanel({ eventId, form, onMetadata }: { eventId: string | null; form: EventFormData; onMetadata: (metadata: Record<string, unknown>) => void }) {
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const metadata = form.metadata;
  const settings = sectionSettings(metadata);
  const resources = Array.isArray(metadata.resource_links) ? metadata.resource_links.filter((row): row is {label:string;url:string} => Boolean(row) && typeof row === "object" && typeof row.label === "string" && typeof row.url === "string") : [];
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
    <div><Label htmlFor="conference-brand">Organizer / event brand</Label><Input id="conference-brand" value={String(metadata.brand_label ?? "")} onChange={e => update("brand_label", e.target.value)} /></div>
    <div><Label>Event appearance</Label><Select value={metadata.theme_preset === "tuskegee" ? "tuskegee" : "network"} onValueChange={value => update("theme_preset", value)}><SelectTrigger aria-label="Event appearance"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="tuskegee">Tuskegee crimson & gold</SelectItem><SelectItem value="network">JESUP network</SelectItem></SelectContent></Select></div>
    <fieldset className="space-y-3 border-y py-4"><legend className="font-semibold">Agenda publication</legend>
      <div><Label>Agenda status</Label><Select value={String(metadata.agenda_status ?? "unannounced")} onValueChange={value => update("agenda_status",value)}><SelectTrigger aria-label="Agenda status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unannounced">Not announced</SelectItem><SelectItem value="draft_placeholder">Preliminary draft</SelectItem><SelectItem value="provisional">Provisional planning draft</SelectItem><SelectItem value="confirmed">Confirmed by organizers</SelectItem></SelectContent></Select></div>
      <div><Label htmlFor="agenda-notice">Planning notice</Label><Input id="agenda-notice" value={String(metadata.agenda_notice ?? "")} onChange={e=>update("agenda_notice",e.target.value)}/></div>
      <div><Label htmlFor="agenda-provenance">Agenda provenance</Label><Input id="agenda-provenance" value={String(metadata.agenda_provenance ?? "")} onChange={e=>update("agenda_provenance",e.target.value)}/></div>
    </fieldset>
    <div className="grid gap-3 sm:grid-cols-2">{[ ["map_url","Campus map URL"], ["parking_url","Parking information URL"] ].map(([key,label]) => <div key={key}><Label htmlFor={key}>{label}</Label><Input id={key} type="url" value={String(metadata[key] ?? "")} onChange={e => update(key,e.target.value)} /></div>)}</div>
    <fieldset className="space-y-3"><legend className="font-semibold">Resource links</legend>{resources.map((row,index) => <div key={index} className="grid items-end gap-2 sm:grid-cols-[1fr_2fr_auto]"><div><Label htmlFor={`resource-label-${index}`}>Label</Label><Input id={`resource-label-${index}`} value={row.label} onChange={e => update("resource_links",resources.map((r,i) => i === index ? {...r,label:e.target.value} : r))}/></div><div><Label htmlFor={`resource-url-${index}`}>HTTPS URL</Label><Input id={`resource-url-${index}`} type="url" value={row.url} onChange={e => update("resource_links",resources.map((r,i) => i === index ? {...r,url:e.target.value} : r))}/></div><Button type="button" variant="ghost" size="icon" aria-label={`Remove resource ${index+1}`} title="Remove resource" onClick={() => update("resource_links",resources.filter((_,i) => i !== index))}><Trash2 className="size-4"/></Button></div>)}<Button type="button" variant="outline" onClick={() => update("resource_links",[...resources,{label:"",url:""}])}><Plus className="size-4"/>Add resource</Button></fieldset>
    <div className="divide-y border-y">{CONFERENCE_SECTIONS.map(([id,label]) => <div key={id} className="flex min-h-12 items-center justify-between gap-3 py-2"><Label htmlFor={`section-${id}`}>{label}</Label><Switch id={`section-${id}`} disabled={id === "home"} checked={id === "home" || settings[id] === true} onCheckedChange={value => update("sections", { ...settings, [id]:value })} /></div>)}</div>
    <div className="space-y-3">{[["community_enabled","Enable registered-attendee community"],["attendee_workspace_enabled","Enable My Event"],["wallet_enabled","Enable issued-credential wallet"],["catalog_enabled","Enable configured catalog"],["eventbrite_claim_enabled","Enable verified Eventbrite ticket claiming"],["staff_operations_enabled","Enable assigned staff operations"]].map(([key,label]) => <div key={key} className="flex items-center justify-between gap-3"><Label htmlFor={key}>{label}</Label><Switch id={key} checked={metadata[key] === true} onCheckedChange={value => update(key,value)} /></div>)}</div>
    <p className="text-sm text-muted-foreground">Sections remain hidden until enabled and configured. Tickets require active catalog products, open registration, or confirmed Eventbrite settings. Resource and map links must use HTTPS. Dates, registration, and related content save with the main event form.</p>
    {eventId && <Button type="button" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save conference settings only"}</Button>}
  </div>;
}