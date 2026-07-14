import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  emptyPublicationForm,
  fetchAdminPublicationForm,
  fetchPublicationCategories,
  savePublication,
  savePublicationCategory,
  slugify,
  uploadPublicationCover,
  uploadPublicationPdf,
  type PublicationFormData,
} from "@/lib/publications";
import { PUBLICATION_CONTENT_TYPES } from "@/lib/publication-content-types";
import { AttachmentPicker } from "@/components/admin/attachment-picker";
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
import { Loader2 } from "lucide-react";
import { fmtDateTime } from "@/lib/format";
import type { FactsheetDraft } from "@/modules/ai/server/factsheet";

type PublicationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicationId: string | null;
  onSaved: () => void;
  initialDraft?: FactsheetDraft | null;
};

export function PublicationFormDialog({
  open,
  onOpenChange,
  publicationId,
  onSaved,
  initialDraft,
}: PublicationFormDialogProps) {
  const [form, setForm] = useState<PublicationFormData>(emptyPublicationForm());
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [tagInput, setTagInput] = useState("");

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["publication-categories"],
    queryFn: fetchPublicationCategories,
  });

  const { data: attachmentOptions } = useQuery({
    queryKey: ["publication-attachment-options"],
    queryFn: async () => {
      const [programs, events, podcasts] = await Promise.all([
        supabase.from("programs").select("id, name").eq("is_active", true).order("name"),
        supabase
          .from("events")
          .select("id, title, starts_at")
          .order("starts_at", { ascending: false }),
        supabase.from("podcast_episodes").select("id, title, guest").order("title"),
      ]);
      return {
        programs: (programs.data ?? []).map((p) => ({ id: p.id, label: p.name })),
        events: (events.data ?? []).map((e) => ({
          id: e.id,
          label: e.title,
          hint: fmtDateTime(e.starts_at),
        })),
        podcasts: (podcasts.data ?? []).map((p) => ({ id: p.id, label: p.title, hint: p.guest })),
      };
    },
  });

  useEffect(() => {
    if (!open) return;
    if (!publicationId) {
      const next = emptyPublicationForm();
      if (initialDraft) {
        next.title = initialDraft.title;
        next.slug = slugify(initialDraft.title);
        next.description = initialDraft.description;
        next.author = initialDraft.author;
        next.tags = initialDraft.tags;
        next.contentType = "factsheet";
        next.isActive = false;
      }
      setForm(next);
      setTagInput(initialDraft?.tags.join(", ") ?? "");
      return;
    }
    fetchAdminPublicationForm(publicationId)
      .then((data) => {
        setForm(data);
        setTagInput(data.tags.join(", "));
      })
      .catch((err) => toast.error(err.message));
  }, [open, publicationId, initialDraft]);

  function syncTags(value: string) {
    setTagInput(value);
    setForm((f) => ({
      ...f,
      tags: value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    }));
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    try {
      const category = await savePublicationCategory(newCategory.trim());
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
      await savePublication(publicationId, form);
      toast.success("Publication saved");
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
          <DialogTitle>{publicationId ? "Edit publication" : "New publication"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="relations">Relations</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4 space-y-3">
              <div>
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Author</Label>
                  <Input
                    value={form.author}
                    onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Content type</Label>
                  <Select
                    value={form.contentType || undefined}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        contentType: v as PublicationFormData["contentType"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PUBLICATION_CONTENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Published date</Label>
                  <Input
                    type="date"
                    value={form.publishedAt}
                    onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={form.categoryId || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
                >
                  <SelectTrigger>
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
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="New category"
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
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={tagInput}
                  onChange={(e) => syncTags(e.target.value)}
                  placeholder="agriculture, youth, research"
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2">
                  <Switch
                    checked={form.isFeatured}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))}
                  />
                  <span className="text-sm">Feature on Home</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-4 space-y-4">
              <div>
                <Label>Cover image</Label>
                {form.coverImageUrl && (
                  <img
                    src={form.coverImageUrl}
                    alt=""
                    className="mb-2 h-32 w-full rounded-xl object-cover"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploadingCover}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingCover(true);
                    try {
                      const url = await uploadPublicationCover(file);
                      setForm((f) => ({ ...f, coverImageUrl: url }));
                      toast.success("Cover uploaded");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Upload failed");
                    } finally {
                      setUploadingCover(false);
                    }
                  }}
                />
              </div>
              <div>
                <Label>Upload PDF</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  disabled={uploadingPdf}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingPdf(true);
                    try {
                      const url = await uploadPublicationPdf(file);
                      setForm((f) => ({ ...f, fileUrl: url }));
                      toast.success("PDF uploaded");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Upload failed");
                    } finally {
                      setUploadingPdf(false);
                    }
                  }}
                />
                {uploadingPdf && (
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                  </p>
                )}
              </div>
              <div>
                <Label>File URL</Label>
                <Input
                  value={form.fileUrl}
                  onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="links" className="mt-4 space-y-3">
              <div>
                <Label>External URL</Label>
                <Input
                  value={form.externalUrl}
                  onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                  placeholder="https://…"
                />
              </div>
            </TabsContent>

            <TabsContent value="relations" className="mt-4 grid gap-4 sm:grid-cols-2">
              <AttachmentPicker
                label="Related programs"
                options={attachmentOptions?.programs ?? []}
                selectedIds={form.programIds}
                onChange={(programIds) => setForm((f) => ({ ...f, programIds }))}
              />
              <AttachmentPicker
                label="Related events"
                options={attachmentOptions?.events ?? []}
                selectedIds={form.eventIds}
                onChange={(eventIds) => setForm((f) => ({ ...f, eventIds }))}
              />
              <AttachmentPicker
                label="Related podcast episodes"
                options={attachmentOptions?.podcasts ?? []}
                selectedIds={form.podcastIds}
                onChange={(podcastIds) => setForm((f) => ({ ...f, podcastIds }))}
              />
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full grad-crimson text-white" disabled={saving}>
            {saving ? "Saving…" : "Save publication"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
