import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  emptyEventForm,
  eventStatusLabel,
  fetchAdminEventForm,
  fetchEventCategories,
  registrationStatusLabel,
  saveEvent,
  saveEventCategory,
  slugify,
  uploadEventImage,
  type EventFormData,
} from "@/lib/events";
import { Link } from "@tanstack/react-router";
import { AttachmentPicker } from "@/components/admin/attachment-picker";
import { EvaluationConfigPanel } from "@/components/admin/evaluation-config-panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { listInstitutions } from "@/lib/institutions";
import { ConferenceSettingsPanel } from "./conference-settings-panel";
import { ConferenceOperationsPanel } from "./conference-operations-panel";
import { EventAgendaNotice } from "@/components/events/event-agenda-notice";

type EventFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
  onSaved: () => void;
};

export function EventFormDialog({ open, onOpenChange, eventId, onSaved }: EventFormDialogProps) {
  const [form, setForm] = useState<EventFormData>(emptyEventForm());
  const [saving, setSaving] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["event-categories"],
    queryFn: fetchEventCategories,
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ["institutions", "event-audience"],
    queryFn: () =>
      listInstitutions({ activeOnly: true, includeOther: false, landGrant1890Only: true }),
  });

  const { data: attachmentOptions } = useQuery({
    queryKey: ["event-attachment-options"],
    queryFn: async () => {
      const [programs, publications, podcasts, partners, grants] = await Promise.all([
        supabase.from("programs").select("id, name").eq("is_active", true).order("name"),
        supabase.from("publications").select("id, title").eq("is_active", true).order("title"),
        supabase.from("podcast_episodes").select("id, title, guest").order("title"),
        supabase.from("partners").select("id, name").order("name"),
        supabase.from("grants").select("id, title, funder").order("title"),
      ]);
      return {
        programs: (programs.data ?? []).map((p) => ({ id: p.id, label: p.name })),
        publications: (publications.data ?? []).map((p) => ({ id: p.id, label: p.title })),
        podcasts: (podcasts.data ?? []).map((p) => ({ id: p.id, label: p.title, hint: p.guest })),
        partners: (partners.data ?? []).map((p) => ({ id: p.id, label: p.name })),
        grants: (grants.data ?? []).map((g) => ({ id: g.id, label: g.title, hint: g.funder })),
      };
    },
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setFormError(null);
    if (!eventId) {
      setForm(emptyEventForm());
      setLoadingForm(false);
      return;
    }
    setLoadingForm(true);
    fetchAdminEventForm(eventId)
      .then(value => { if (!cancelled) setForm(value); })
      .catch((err) => { if (!cancelled) setFormError(err.message); })
      .finally(() => { if (!cancelled) setLoadingForm(false); });
    return () => { cancelled = true; };
  }, [open, eventId]);

  async function addCategory() {
    if (!newCategory.trim()) return;
    try {
      const category = await saveEventCategory(newCategory.trim());
      await refetchCategories();
      setForm((f) => ({ ...f, categoryId: category.id }));
      setNewCategory("");
      toast.success("Category added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add category");
    }
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    try {
      const url = await uploadEventImage(file, "covers");
      setForm((f) => ({ ...f, coverImageUrl: url }));
      toast.success("Cover uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveEvent(eventId, form);
      toast.success("Event saved");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{eventId ? "Edit event" : "Create event"}</DialogTitle>
        </DialogHeader>
        {loadingForm ? <p role="status">Loading event…</p> : formError ? <p role="alert">{formError}</p> : <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basics">
            <TabsList className="flex h-auto flex-wrap gap-1">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="gis">GIS & geofence</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="speakers">Speakers</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="relations">Relations</TabsTrigger>
              <TabsTrigger value="registration">Registration</TabsTrigger>
              <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
              <TabsTrigger value="conference">Conference shell</TabsTrigger>
              {eventId && <TabsTrigger value="operations">Conference operations</TabsTrigger>}
            </TabsList>

            <TabsContent value="basics" className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Title *</Label>
                  <Input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        title: e.target.value,
                        slug: f.slug || slugify(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={form.categoryId || "none"}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, categoryId: v === "none" ? "" : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New category"
                  />
                  <Button type="button" variant="outline" onClick={addCategory}>
                    Add
                  </Button>
                </div>
                <div className="sm:col-span-2 flex items-center justify-between gap-3">
                  <Label htmlFor="event-date-only">Dates only · service times unconfirmed</Label>
                  <Switch id="event-date-only" checked={form.metadata.date_only === true} onCheckedChange={value => setForm(f => ({ ...f, metadata: { ...f.metadata, date_only: value, start_date: f.metadata.start_date ?? f.startsAt.slice(0, 10), end_date: f.metadata.end_date ?? f.endsAt.slice(0, 10) } }))} />
                </div>
                <div>
                  <Label>{form.metadata.date_only === true ? "First date *" : "Starts *"}</Label>
                  <Input
                    aria-label={form.metadata.date_only === true ? "First date" : "Starts"}
                    type={form.metadata.date_only === true ? "date" : "datetime-local"}
                    required
                    value={form.metadata.date_only === true ? String(form.metadata.start_date ?? "") : form.startsAt}
                    onChange={(e) => setForm((f) => form.metadata.date_only === true ? { ...f, metadata: { ...f.metadata, start_date: e.target.value } } : { ...f, startsAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{form.metadata.date_only === true ? "Last date (inclusive) *" : "Ends"}</Label>
                  <Input
                    aria-label={form.metadata.date_only === true ? "Last date (inclusive)" : "Ends"}
                    type={form.metadata.date_only === true ? "date" : "datetime-local"}
                    required={form.metadata.date_only === true}
                    value={form.metadata.date_only === true ? String(form.metadata.end_date ?? "") : form.endsAt}
                    onChange={(e) => setForm((f) => form.metadata.date_only === true ? { ...f, metadata: { ...f.metadata, end_date: e.target.value } } : { ...f, endsAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={form.locationAddress}
                    onChange={(e) => setForm((f) => ({ ...f, locationAddress: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Latitude</Label>
                  <Input
                    value={form.lat}
                    onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input
                    value={form.lng}
                    onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Rich description (HTML)</Label>
                  <Textarea
                    value={form.descriptionHtml}
                    onChange={(e) => setForm((f) => ({ ...f, descriptionHtml: e.target.value }))}
                    rows={5}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, status: v as EventFormData["status"] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["draft", "published", "archived"] as const).map((status) => (
                        <SelectItem key={status} value={status}>
                          {eventStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Official information URL</Label>
                  <Input
                    value={form.externalUrl}
                    onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                    placeholder="Background information only; registration stays inside JESUP"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isFeatured}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))}
                  />
                  <Label>Featured</Label>
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-secondary/25 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label className="text-sm font-bold">Shared 1890 network event</Label>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Shared events appear for every institution. Turn this off to target selected
                      schools only.
                    </p>
                  </div>
                  <Switch
                    checked={form.metadata.network_wide !== false}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        metadata: { ...current.metadata, network_wide: checked },
                      }))
                    }
                    aria-label="Shared across the 1890 network"
                  />
                </div>
                {form.metadata.network_wide === false ? (
                  <div className="mt-4 border-t border-border/60 pt-4">
                    <AttachmentPicker
                      label="Visible to these institutions"
                      options={institutions.map((institution) => ({
                        id: institution.id,
                        label: institution.name,
                        hint: institution.state,
                      }))}
                      selectedIds={
                        Array.isArray(form.metadata.institution_ids)
                          ? form.metadata.institution_ids.filter(
                              (value): value is string => typeof value === "string",
                            )
                          : []
                      }
                      onChange={(institutionIds) =>
                        setForm((current) => ({
                          ...current,
                          metadata: {
                            ...current.metadata,
                            network_wide: false,
                            institution_ids: institutionIds,
                          },
                        }))
                      }
                    />
                  </div>
                ) : null}
              </div>
              <div>
                <Label>Cover image</Label>
                <p className="mt-1 text-xs text-muted-foreground">Recommended: 2000 × 1250 px.</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Input
                    value={form.coverImageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                  />
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    {uploadingCover ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload
                    <input
                      id="event-cover-upload"
                      name="eventCover"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
                    />
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gis" className="space-y-5 pt-4">
              <div className="border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Define the event site for maps, proximity check-in, attendance validation, and
                location reporting. JESUP requests attendee permission before checking location.
              </div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <Label htmlFor="event-geofence-enabled">Enable event geofence</Label>
                  <p className="text-xs text-muted-foreground">
                    Use these coordinates and radius as the approved event area.
                  </p>
                </div>
                <Switch
                  id="event-geofence-enabled"
                  checked={form.geofenceEnabled}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, geofenceEnabled: checked }))
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="event-gis-lat">Latitude</Label>
                  <Input
                    id="event-gis-lat"
                    inputMode="decimal"
                    value={form.lat}
                    onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                    placeholder="32.4302"
                  />
                </div>
                <div>
                  <Label htmlFor="event-gis-lng">Longitude</Label>
                  <Input
                    id="event-gis-lng"
                    inputMode="decimal"
                    value={form.lng}
                    onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                    placeholder="-85.7077"
                  />
                </div>
                <div>
                  <Label htmlFor="event-geofence-radius">Radius (meters)</Label>
                  <Input
                    id="event-geofence-radius"
                    type="number"
                    min="25"
                    max="50000"
                    value={form.geofenceRadiusMeters}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, geofenceRadiusMeters: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="event-gis-boundary">Optional GeoJSON boundary</Label>
                <Textarea
                  id="event-gis-boundary"
                  value={form.gisBoundaryGeoJson}
                  onChange={(e) => setForm((f) => ({ ...f, gisBoundaryGeoJson: e.target.value }))}
                  rows={9}
                  spellCheck={false}
                  placeholder={'{"type":"Polygon","coordinates":[...]}'}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Accepts a GeoJSON Feature, Polygon, or MultiPolygon.
                </p>
              </div>
              {form.lat && form.lng && (
                <iframe
                  title="Event geofence map preview"
                  className="h-72 w-full border border-border"
                  loading="lazy"
                  src={`https://www.google.com/maps?q=${form.lat},${form.lng}&z=16&output=embed`}
                />
              )}
            </TabsContent>

            <TabsContent value="agenda" className="space-y-4 pt-4">
              <EventAgendaNotice metadata={form.metadata} />
              <p className="text-sm text-muted-foreground">Session times use {form.timezone || "America/Chicago"}. Leave unknown locations blank. Planning blocks do not create meal tickets, tour access or registration.</p>
              {form.sessions.map((session, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <div className="flex justify-between">
                    <Label>Session {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          sessions: f.sessions.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    aria-label={`Session ${index + 1} title`}
                    value={session.title}
                    placeholder="Title"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sessions: f.sessions.map((s, i) =>
                          i === index ? { ...s, title: e.target.value } : s,
                        ),
                      }))
                    }
                  />
                  <Textarea
                    aria-label={`Session ${index + 1} description`}
                    value={session.description ?? ""}
                    placeholder="Description"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sessions: f.sessions.map((s, i) =>
                          i === index ? { ...s, description: e.target.value } : s,
                        ),
                      }))
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      aria-label={`Session ${index + 1} start`}
                      type="datetime-local"
                      value={session.startsAt ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          sessions: f.sessions.map((s, i) =>
                            i === index ? { ...s, startsAt: e.target.value } : s,
                          ),
                        }))
                      }
                    />
                    <Input
                      aria-label={`Session ${index + 1} end`}
                      type="datetime-local"
                      value={session.endsAt ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          sessions: f.sessions.map((s, i) =>
                            i === index ? { ...s, endsAt: e.target.value } : s,
                          ),
                        }))
                      }
                    />
                  </div>
                  <Input
                    aria-label={`Session ${index + 1} location`}
                    value={session.location ?? ""}
                    placeholder="Location"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sessions: f.sessions.map((s, i) =>
                          i === index ? { ...s, location: e.target.value } : s,
                        ),
                      }))
                    }
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    sessions: [
                      ...f.sessions,
                      {
                        title: "",
                        description: "",
                        startsAt: "",
                        endsAt: "",
                        location: "",
                        sortOrder: f.sessions.length,
                      },
                    ],
                  }))
                }
              >
                <Plus className="h-4 w-4" /> Add session
              </Button>
            </TabsContent>

            <TabsContent value="speakers" className="space-y-4 pt-4">
              {form.speakers.map((speaker, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <div className="flex justify-between">
                    <Label>Speaker {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          speakers: f.speakers.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={speaker.name}
                    placeholder="Name"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        speakers: f.speakers.map((s, i) =>
                          i === index ? { ...s, name: e.target.value } : s,
                        ),
                      }))
                    }
                  />
                  <Input
                    value={speaker.title ?? ""}
                    placeholder="Title"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        speakers: f.speakers.map((s, i) =>
                          i === index ? { ...s, title: e.target.value } : s,
                        ),
                      }))
                    }
                  />
                  <Textarea
                    value={speaker.bio ?? ""}
                    placeholder="Bio"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        speakers: f.speakers.map((s, i) =>
                          i === index ? { ...s, bio: e.target.value } : s,
                        ),
                      }))
                    }
                  />
                  <Input
                    value={speaker.photoUrl ?? ""}
                    placeholder="Photo URL"
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        speakers: f.speakers.map((s, i) =>
                          i === index ? { ...s, photoUrl: e.target.value } : s,
                        ),
                      }))
                    }
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    speakers: [
                      ...f.speakers,
                      { name: "", title: "", bio: "", photoUrl: "", sortOrder: f.speakers.length },
                    ],
                  }))
                }
              >
                <Plus className="h-4 w-4" /> Add speaker
              </Button>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-4 pt-4">
              {eventId ? (
                <div className="rounded-lg border p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Manage gallery images, cover selection, metadata, and participant submissions on
                    the dedicated gallery page.
                  </p>
                  <Button type="button" variant="outline" asChild>
                    <Link to="/admin/events/$eventId/gallery" params={{ eventId }}>
                      Open gallery manager
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Save the event first, then use the gallery manager to upload and organize photos.
                </p>
              )}
            </TabsContent>

            <TabsContent value="relations" className="space-y-4 pt-4">
              <AttachmentPicker
                label="Programs"
                options={attachmentOptions?.programs ?? []}
                selectedIds={form.programIds}
                onChange={(ids) => setForm((f) => ({ ...f, programIds: ids }))}
              />
              <AttachmentPicker
                label="Publications"
                options={attachmentOptions?.publications ?? []}
                selectedIds={form.publicationIds}
                onChange={(ids) => setForm((f) => ({ ...f, publicationIds: ids }))}
              />
              <AttachmentPicker
                label="Podcast episodes"
                options={attachmentOptions?.podcasts ?? []}
                selectedIds={form.podcastIds}
                onChange={(ids) => setForm((f) => ({ ...f, podcastIds: ids }))}
              />
              <AttachmentPicker
                label="Partners / sponsors"
                options={attachmentOptions?.partners ?? []}
                selectedIds={form.partnerIds}
                onChange={(ids) => setForm((f) => ({ ...f, partnerIds: ids }))}
              />
              <AttachmentPicker
                label="Grants"
                options={attachmentOptions?.grants ?? []}
                selectedIds={form.grantIds}
                onChange={(ids) => setForm((f) => ({ ...f, grantIds: ids }))}
              />
            </TabsContent>

            <TabsContent value="registration" className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Registration and payment provider</Label>
                  <Select
                    value={form.registrationProvider}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        registrationProvider: value as EventFormData["registrationProvider"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jesup">JESUP — free registration</SelectItem>
                      <SelectItem value="eventbrite">Eventbrite — organizer registration</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {form.slug === "fc135" ? "Tuskegee University organizes FC135 on Eventbrite and receives ticket proceeds. HNCH LLC is paid separately as a Tuskegee vendor under its agreement/invoice, not through ticket checkout. No JESUP application fee applies; native checkout stays disabled." : "Eventbrite registration links require organizer-confirmed publication, authorization, and an open registration status. Native ticket checkout is not enabled by this selection."}
                  </p>
                </div>
                <div>
                  <Label>Registration status</Label>
                  <Select
                    value={form.registrationStatus}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        registrationStatus: v as EventFormData["registrationStatus"],
                        registrationOpen: v === "open" || v === "waiting_list",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["open", "closed", "waiting_list", "sold_out", "invite_only"] as const).map(
                        (status) => (
                          <SelectItem key={status} value={status}>
                            {registrationStatusLabel(status)}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Invite code</Label>
                  <Input
                    value={form.inviteCode}
                    onChange={(e) => setForm((f) => ({ ...f, inviteCode: e.target.value }))}
                  />
                </div>
                {form.registrationProvider === "eventbrite" && (
                  <>
                    <div>
                      <Label>Eventbrite Event ID *</Label>
                      <Input
                        required
                        inputMode="numeric"
                        value={form.eventbriteEventId}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            eventbriteEventId: e.target.value.replace(/\D/g, ""),
                            metadata: { ...f.metadata, eventbrite_registration_authorized: false },
                          }))
                        }
                        placeholder="1234567890123"
                      />
                    </div>
                    <div>
                      <Label>Price shown in JESUP</Label>
                      <Input
                        value={form.ticketPriceLabel}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, ticketPriceLabel: e.target.value }))
                        }
                        placeholder="$25 or $25–$75"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Authorized public Eventbrite registration URL</Label>
                      <Input
                        type="url"
                        value={form.eventbriteEventUrl}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, eventbriteEventUrl: e.target.value, metadata: { ...f.metadata, eventbrite_registration_authorized: false } }))
                        }
                        placeholder="https://www.eventbrite.com/e/..."
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Leave blank for drafts. Use only the published registration URL approved by the organizer; no access to the organizer's payout settings is implied.
                      </p>
                    </div>
                    <div className="sm:col-span-2 space-y-3">
                      {form.slug === "fc135" && <p className="text-sm text-muted-foreground">FC135 Eventbrite event 2003462000776 is an unpublished draft. Keep registration closed until Tuskegee confirms publication, payout setup, and the authorized registration URL.</p>}
                      <Label htmlFor="eventbrite-published">Organizer confirms Eventbrite event is published</Label>
                      <Switch id="eventbrite-published" checked={form.metadata.eventbrite_event_status === "published"} onCheckedChange={value => setForm(f => ({ ...f, metadata: { ...f.metadata, eventbrite_event_status: value ? "published" : "draft", eventbrite_registration_authorized: false } }))} />
                      <Label htmlFor="eventbrite-authorized">Organizer authorizes this public registration URL</Label>
                      <Switch id="eventbrite-authorized" disabled={!form.eventbriteEventUrl.trim() || form.metadata.eventbrite_event_status !== "published"} checked={form.metadata.eventbrite_registration_authorized === true} onCheckedChange={value => setForm(f => ({ ...f, metadata: { ...f.metadata, eventbrite_registration_authorized: value } }))} />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="evaluation" className="space-y-4 pt-4">
              <EvaluationConfigPanel eventId={eventId} />
            </TabsContent>
            <TabsContent value="conference" className="space-y-4 pt-4">
              <ConferenceSettingsPanel eventId={eventId} form={form} onMetadata={(metadata) => setForm(current => ({ ...current, metadata }))} />
            </TabsContent>
              {eventId && <TabsContent value="operations" className="pt-4"><ConferenceOperationsPanel eventId={eventId} isFc135={form.slug === "fc135"} /></TabsContent>}
          </Tabs>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save event"
            )}
          </Button>
        </form>}
      </DialogContent>
    </Dialog>
  );
}
