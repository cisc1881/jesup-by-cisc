import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  emptyProgramForm,
  fetchAdminProgramForm,
  fetchProgramCategories,
  saveProgram,
  saveProgramCategory,
  slugify,
  uploadProgramImage,
  type ProgramFormData,
  type ProgramGalleryImage,
} from "@/lib/programs";
import { AttachmentPicker } from "@/components/admin/attachment-picker";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Trash2, Upload } from "lucide-react";
import { fmtDateTime } from "@/lib/format";

type ProgramFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string | null;
  onSaved: () => void;
};

export function ProgramFormDialog({ open, onOpenChange, programId, onSaved }: ProgramFormDialogProps) {
  const [form, setForm] = useState<ProgramFormData>(emptyProgramForm());
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["program-categories"],
    queryFn: fetchProgramCategories,
  });

  const { data: attachmentOptions } = useQuery({
    queryKey: ["program-attachment-options"],
    queryFn: async () => {
      const [pubs, pods, events, partners, grants] = await Promise.all([
        supabase.from("publications").select("id, title, publication_categories ( name )").order("title"),
        supabase.from("podcast_episodes").select("id, title, guest").order("title"),
        supabase.from("events").select("id, title, starts_at").order("starts_at", { ascending: false }),
        supabase.from("partners").select("id, name").order("name"),
        supabase.from("grants").select("id, title, funder").order("title"),
      ]);
      return {
        publications: (pubs.data ?? []).map((p) => ({
          id: p.id,
          label: p.title,
          hint: (p.publication_categories as { name: string } | null)?.name ?? undefined,
        })),
        podcasts: (pods.data ?? []).map((p) => ({ id: p.id, label: p.title, hint: p.guest })),
        events: (events.data ?? []).map((e) => ({ id: e.id, label: e.title, hint: fmtDateTime(e.starts_at) })),
        partners: (partners.data ?? []).map((p) => ({ id: p.id, label: p.name })),
        grants: (grants.data ?? []).map((g) => ({ id: g.id, label: g.title, hint: g.funder })),
      };
    },
  });

  useEffect(() => {
    if (!open) return;
    if (!programId) {
      setForm(emptyProgramForm());
      return;
    }
    fetchAdminProgramForm(programId)
      .then(setForm)
      .catch((err) => toast.error(err.message));
  }, [open, programId]);

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    try {
      const url = await uploadProgramImage(file, "logos");
      setForm((f) => ({ ...f, logoUrl: url }));
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    try {
      const url = await uploadProgramImage(file, "covers");
      setForm((f) => ({ ...f, coverImageUrl: url }));
      toast.success("Cover uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleGalleryUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploadingGallery(true);
    try {
      const uploaded: ProgramGalleryImage[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadProgramImage(file, "gallery");
        uploaded.push({ imageUrl: url, caption: null, sortOrder: form.gallery.length + uploaded.length });
      }
      setForm((f) => ({ ...f, gallery: [...f.gallery, ...uploaded] }));
      toast.success(`Uploaded ${uploaded.length} image(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingGallery(false);
    }
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    try {
      const category = await saveProgramCategory(newCategory.trim());
      await refetchCategories();
      setForm((f) => ({ ...f, categoryId: category.id }));
      setNewCategory("");
      toast.success("Category added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add category");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProgram(programId, form);
      toast.success("Program saved");
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
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{programId ? "Edit program" : "New program"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="attachments">Links</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4 space-y-3">
              <div>
                <Label>Name *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug: f.slug || slugify(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
                </div>
                <div>
                  <Label>Short label</Label>
                  <Input value={form.short} onChange={(e) => setForm((f) => ({ ...f, short: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Tagline</Label>
                <Input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
              </div>
              <div>
                <Label>Category</Label>
                <div className="flex gap-2">
                  <Select value={form.categoryId || undefined} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="New category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void addCategory();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addCategory}>
                    Add
                  </Button>
                </div>
              </div>
              <div>
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2">
                  <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} />
                  <span className="text-sm">Featured program</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
                  <span className="text-sm">Active</span>
                </label>
              </div>
            </TabsContent>

            <TabsContent value="content" className="mt-4 space-y-4">
              <div>
                <Label className="mb-2 block">Description</Label>
                <RichTextEditor
                  value={form.descriptionHtml}
                  onChange={(descriptionHtml) => setForm((f) => ({ ...f, descriptionHtml }))}
                  placeholder="Program overview…"
                />
              </div>
              <div>
                <Label className="mb-2 block">Objectives</Label>
                <RichTextEditor
                  value={form.objectivesHtml}
                  onChange={(objectivesHtml) => setForm((f) => ({ ...f, objectivesHtml }))}
                  placeholder="Program objectives and outcomes…"
                />
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-4 space-y-4">
              <div>
                <Label>Hero / cover image</Label>
                <p className="mb-2 text-xs text-muted-foreground">Recommended: 1600 × 1200 px. Featured hero artwork should be 2400 × 1350 px.</p>
                {form.coverImageUrl && (
                  <img src={form.coverImageUrl} alt="" className="mb-2 h-32 w-full rounded-xl object-cover" />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploadingCover}
                  onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
                />
                {uploadingCover && (
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                  </p>
                )}
              </div>

              <div>
                <Label>Program logo (optional)</Label>
                <p className="mb-2 text-xs text-muted-foreground">Recommended: 1200 × 600 px.</p>
                {form.logoUrl && (
                  <img src={form.logoUrl} alt="" className="mb-2 h-20 w-20 rounded-xl border object-contain p-2" />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploadingLogo}
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                />
              </div>

              <div>
                <Label>Gallery images</Label>
                <p className="mb-2 text-xs text-muted-foreground">Recommended: 1600 × 1200 px.</p>
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {form.gallery.map((image, index) => (
                    <div key={`${image.imageUrl}-${index}`} className="relative overflow-hidden rounded-xl border">
                      <img src={image.imageUrl} alt="" className="aspect-square w-full object-cover" />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute right-1 top-1 h-7 w-7"
                        onClick={() =>
                          setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== index) }))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground hover:bg-secondary/50">
                  <Upload className="h-4 w-4" />
                  {uploadingGallery ? "Uploading…" : "Add gallery images"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploadingGallery}
                    onChange={(e) => handleGalleryUpload(e.target.files)}
                  />
                </label>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="mt-4 space-y-3">
              <div>
                <Label>Program director</Label>
                <Input value={form.programDirector} onChange={(e) => setForm((f) => ({ ...f, programDirector: e.target.value }))} />
              </div>
              <div>
                <Label>Contact person</Label>
                <Input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Website</Label>
                <Input value={form.websiteUrl} onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))} placeholder="https://…" />
              </div>
              <div>
                <Label>External registration link</Label>
                <Input value={form.registrationUrl} onChange={(e) => setForm((f) => ({ ...f, registrationUrl: e.target.value }))} placeholder="https://…" />
              </div>
            </TabsContent>

            <TabsContent value="attachments" className="mt-4 grid gap-4 sm:grid-cols-2">
              <AttachmentPicker
                label="Publications"
                options={attachmentOptions?.publications ?? []}
                selectedIds={form.publicationIds}
                onChange={(publicationIds) => setForm((f) => ({ ...f, publicationIds }))}
              />
              <AttachmentPicker
                label="Podcast episodes"
                options={attachmentOptions?.podcasts ?? []}
                selectedIds={form.podcastIds}
                onChange={(podcastIds) => setForm((f) => ({ ...f, podcastIds }))}
              />
              <AttachmentPicker
                label="Events"
                options={attachmentOptions?.events ?? []}
                selectedIds={form.eventIds}
                onChange={(eventIds) => setForm((f) => ({ ...f, eventIds }))}
              />
              <AttachmentPicker
                label="Partners"
                options={attachmentOptions?.partners ?? []}
                selectedIds={form.partnerIds}
                onChange={(partnerIds) => setForm((f) => ({ ...f, partnerIds }))}
              />
              <AttachmentPicker
                label="Grants"
                options={attachmentOptions?.grants ?? []}
                selectedIds={form.grantIds}
                onChange={(grantIds) => setForm((f) => ({ ...f, grantIds }))}
              />
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full grad-crimson text-white" disabled={saving}>
            {saving ? "Saving…" : "Save program"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
