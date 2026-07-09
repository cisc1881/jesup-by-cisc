import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AttachmentPicker } from "@/components/admin/attachment-picker";
import { RichTextEditor } from "@/components/rich-text-editor";
import { NEWS_CATEGORIES } from "@/lib/news-categories";
import {
  emptyNewsForm,
  fetchAdminNewsForm,
  saveNewsArticle,
  slugify,
  uploadNewsCover,
  type NewsFormData,
} from "@/lib/news";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { fmtDateTime } from "@/lib/format";

type NewsFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string | null;
  onSaved: () => void;
};

export function NewsFormDialog({ open, onOpenChange, articleId, onSaved }: NewsFormDialogProps) {
  const [form, setForm] = useState<NewsFormData>(emptyNewsForm());
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const { data: attachmentOptions } = useQuery({
    queryKey: ["news-attachment-options"],
    queryFn: async () => {
      const [programs, events, publications, partners] = await Promise.all([
        supabase.from("programs").select("id, name").eq("is_active", true).order("name"),
        supabase.from("events").select("id, title, starts_at").order("starts_at", { ascending: false }),
        supabase.from("publications").select("id, title").eq("is_active", true).order("title"),
        supabase.from("partners").select("id, name").eq("is_published", true).order("name"),
      ]);
      return {
        programs: (programs.data ?? []).map((p) => ({ id: p.id, label: p.name })),
        events: (events.data ?? []).map((e) => ({ id: e.id, label: e.title, hint: fmtDateTime(e.starts_at) })),
        publications: (publications.data ?? []).map((p) => ({ id: p.id, label: p.title })),
        partners: (partners.data ?? []).map((p) => ({ id: p.id, label: p.name })),
      };
    },
  });

  useEffect(() => {
    if (!open) return;
    if (!articleId) {
      setForm(emptyNewsForm());
      setTagInput("");
      return;
    }
    fetchAdminNewsForm(articleId)
      .then((data) => {
        setForm(data);
        setTagInput(data.tags.join(", "));
      })
      .catch((err) => toast.error(err.message));
  }, [open, articleId]);

  function syncTags(value: string) {
    setTagInput(value);
    setForm((f) => ({
      ...f,
      tags: value.split(",").map((t) => t.trim()).filter(Boolean),
    }));
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    try {
      const url = await uploadNewsCover(file);
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
      await saveNewsArticle(articleId, form);
      toast.success("Article saved");
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
          <DialogTitle>{articleId ? "Edit article" : "New article"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
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
                  <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category || undefined} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {NEWS_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Author</Label>
                  <Input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
                </div>
                <div>
                  <Label>Published at</Label>
                  <Input
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea
                  rows={3}
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  placeholder="Short excerpt for cards and search"
                />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={tagInput} onChange={(e) => syncTags(e.target.value)} placeholder="extension, agriculture" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Reading time (minutes)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.readingTimeMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, readingTimeMinutes: e.target.value }))}
                    placeholder="Auto-calculated from content"
                  />
                </div>
                <div>
                  <Label>Sort order</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2">
                  <Switch checked={form.isPublished} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} />
                  <span className="text-sm">Published</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} />
                  <span className="text-sm">Featured</span>
                </label>
              </div>
            </TabsContent>

            <TabsContent value="content" className="mt-4 space-y-3">
              <div>
                <Label>Article body</Label>
                <RichTextEditor
                  value={form.contentHtml}
                  onChange={(html) => setForm((f) => ({ ...f, contentHtml: html }))}
                  placeholder="Write your story…"
                />
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-4 space-y-3">
              <div>
                <Label>Cover image URL</Label>
                <Input
                  value={form.coverImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                  placeholder="https://…"
                />
              </div>
              <div>
                <Label>Upload cover</Label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm hover:bg-secondary/60">
                  {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Choose image
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleCoverUpload(file);
                    }}
                  />
                </label>
              </div>
              {form.coverImageUrl && (
                <img src={form.coverImageUrl} alt="" className="max-h-48 rounded-xl object-cover" />
              )}
            </TabsContent>

            <TabsContent value="seo" className="mt-4 space-y-3">
              <div>
                <Label>SEO title</Label>
                <Input value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} />
              </div>
              <div>
                <Label>SEO description</Label>
                <Textarea
                  rows={3}
                  value={form.seoDescription}
                  onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="relations" className="mt-4 space-y-4">
              <AttachmentPicker
                label="Related programs"
                options={attachmentOptions?.programs ?? []}
                selectedIds={form.programIds}
                onChange={(ids) => setForm((f) => ({ ...f, programIds: ids }))}
              />
              <AttachmentPicker
                label="Related events"
                options={attachmentOptions?.events ?? []}
                selectedIds={form.eventIds}
                onChange={(ids) => setForm((f) => ({ ...f, eventIds: ids }))}
              />
              <AttachmentPicker
                label="Related publications"
                options={attachmentOptions?.publications ?? []}
                selectedIds={form.publicationIds}
                onChange={(ids) => setForm((f) => ({ ...f, publicationIds: ids }))}
              />
              <AttachmentPicker
                label="Related partners"
                options={attachmentOptions?.partners ?? []}
                selectedIds={form.partnerIds}
                onChange={(ids) => setForm((f) => ({ ...f, partnerIds: ids }))}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save article
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
