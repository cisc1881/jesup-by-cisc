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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";

type EventFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string | null;
  onSaved: () => void;
};

export function EventFormDialog({ open, onOpenChange, eventId, onSaved }: EventFormDialogProps) {
  const [form, setForm] = useState<EventFormData>(emptyEventForm());
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["event-categories"],
    queryFn: fetchEventCategories,
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
    if (!eventId) {
      setForm(emptyEventForm());
      return;
    }
    fetchAdminEventForm(eventId)
      .then(setForm)
      .catch((err) => toast.error(err.message));
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basics">
            <TabsList className="flex h-auto flex-wrap gap-1">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="speakers">Speakers</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="relations">Relations</TabsTrigger>
              <TabsTrigger value="registration">Registration</TabsTrigger>
              <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
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
                  <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.categoryId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v === "none" ? "" : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category" />
                  <Button type="button" variant="outline" onClick={addCategory}>Add</Button>
                </div>
                <div>
                  <Label>Starts *</Label>
                  <Input type="datetime-local" required value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
                </div>
                <div>
                  <Label>Ends</Label>
                  <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={form.locationAddress} onChange={(e) => setForm((f) => ({ ...f, locationAddress: e.target.value }))} />
                </div>
                <div>
                  <Label>Latitude</Label>
                  <Input value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Rich description (HTML)</Label>
                  <Textarea value={form.descriptionHtml} onChange={(e) => setForm((f) => ({ ...f, descriptionHtml: e.target.value }))} rows={5} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as EventFormData["status"] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["draft", "published", "archived"] as const).map((status) => (
                        <SelectItem key={status} value={status}>{eventStatusLabel(status)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Official information URL</Label>
                  <Input value={form.externalUrl} onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))} placeholder="Background information only; registration stays inside JESUP" />
                </div>
                <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} /><Label>Active</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} /><Label>Featured</Label></div>
              </div>
              <div>
                <Label>Cover image</Label>
                <p className="mt-1 text-xs text-muted-foreground">Recommended: 2000 × 1250 px.</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Input value={form.coverImageUrl} onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))} />
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="agenda" className="space-y-4 pt-4">
              {form.sessions.map((session, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <div className="flex justify-between"><Label>Session {index + 1}</Label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setForm((f) => ({ ...f, sessions: f.sessions.filter((_, i) => i !== index) }))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <Input value={session.title} placeholder="Title" onChange={(e) => setForm((f) => ({ ...f, sessions: f.sessions.map((s, i) => i === index ? { ...s, title: e.target.value } : s) }))} />
                  <Textarea value={session.description ?? ""} placeholder="Description" onChange={(e) => setForm((f) => ({ ...f, sessions: f.sessions.map((s, i) => i === index ? { ...s, description: e.target.value } : s) }))} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input type="datetime-local" value={session.startsAt ?? ""} onChange={(e) => setForm((f) => ({ ...f, sessions: f.sessions.map((s, i) => i === index ? { ...s, startsAt: e.target.value } : s) }))} />
                    <Input type="datetime-local" value={session.endsAt ?? ""} onChange={(e) => setForm((f) => ({ ...f, sessions: f.sessions.map((s, i) => i === index ? { ...s, endsAt: e.target.value } : s) }))} />
                  </div>
                  <Input value={session.location ?? ""} placeholder="Location" onChange={(e) => setForm((f) => ({ ...f, sessions: f.sessions.map((s, i) => i === index ? { ...s, location: e.target.value } : s) }))} />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => setForm((f) => ({ ...f, sessions: [...f.sessions, { title: "", description: "", startsAt: "", endsAt: "", location: "", sortOrder: f.sessions.length }] }))}>
                <Plus className="h-4 w-4" /> Add session
              </Button>
            </TabsContent>

            <TabsContent value="speakers" className="space-y-4 pt-4">
              {form.speakers.map((speaker, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <div className="flex justify-between"><Label>Speaker {index + 1}</Label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setForm((f) => ({ ...f, speakers: f.speakers.filter((_, i) => i !== index) }))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <Input value={speaker.name} placeholder="Name" onChange={(e) => setForm((f) => ({ ...f, speakers: f.speakers.map((s, i) => i === index ? { ...s, name: e.target.value } : s) }))} />
                  <Input value={speaker.title ?? ""} placeholder="Title" onChange={(e) => setForm((f) => ({ ...f, speakers: f.speakers.map((s, i) => i === index ? { ...s, title: e.target.value } : s) }))} />
                  <Textarea value={speaker.bio ?? ""} placeholder="Bio" onChange={(e) => setForm((f) => ({ ...f, speakers: f.speakers.map((s, i) => i === index ? { ...s, bio: e.target.value } : s) }))} />
                  <Input value={speaker.photoUrl ?? ""} placeholder="Photo URL" onChange={(e) => setForm((f) => ({ ...f, speakers: f.speakers.map((s, i) => i === index ? { ...s, photoUrl: e.target.value } : s) }))} />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => setForm((f) => ({ ...f, speakers: [...f.speakers, { name: "", title: "", bio: "", photoUrl: "", sortOrder: f.speakers.length }] }))}>
                <Plus className="h-4 w-4" /> Add speaker
              </Button>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-4 pt-4">
              {eventId ? (
                <div className="rounded-lg border p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Manage gallery images, cover selection, metadata, and participant submissions on the dedicated gallery page.
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
              <AttachmentPicker label="Programs" options={attachmentOptions?.programs ?? []} selectedIds={form.programIds} onChange={(ids) => setForm((f) => ({ ...f, programIds: ids }))} />
              <AttachmentPicker label="Publications" options={attachmentOptions?.publications ?? []} selectedIds={form.publicationIds} onChange={(ids) => setForm((f) => ({ ...f, publicationIds: ids }))} />
              <AttachmentPicker label="Podcast episodes" options={attachmentOptions?.podcasts ?? []} selectedIds={form.podcastIds} onChange={(ids) => setForm((f) => ({ ...f, podcastIds: ids }))} />
              <AttachmentPicker label="Partners / sponsors" options={attachmentOptions?.partners ?? []} selectedIds={form.partnerIds} onChange={(ids) => setForm((f) => ({ ...f, partnerIds: ids }))} />
              <AttachmentPicker label="Grants" options={attachmentOptions?.grants ?? []} selectedIds={form.grantIds} onChange={(ids) => setForm((f) => ({ ...f, grantIds: ids }))} />
            </TabsContent>

            <TabsContent value="registration" className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Registration status</Label>
                  <Select value={form.registrationStatus} onValueChange={(v) => setForm((f) => ({ ...f, registrationStatus: v as EventFormData["registrationStatus"], registrationOpen: v === "open" || v === "waiting_list" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["open", "closed", "waiting_list", "sold_out", "invite_only"] as const).map((status) => (
                        <SelectItem key={status} value={status}>{registrationStatusLabel(status)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Invite code</Label>
                  <Input value={form.inviteCode} onChange={(e) => setForm((f) => ({ ...f, inviteCode: e.target.value }))} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="evaluation" className="space-y-4 pt-4">
              <EvaluationConfigPanel eventId={eventId} />
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save event"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
