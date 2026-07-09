import { useEffect, useState } from "react";
import {
  emptyPodcastForm,
  fetchAdminPodcastForm,
  savePodcast,
  slugify,
  uploadPodcastCover,
  type PodcastFormData,
} from "@/lib/podcasts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

type PodcastFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeId: string | null;
  onSaved: () => void;
};

export function PodcastFormDialog({ open, onOpenChange, episodeId, onSaved }: PodcastFormDialogProps) {
  const [form, setForm] = useState<PodcastFormData>(emptyPodcastForm());
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!episodeId) {
      setForm(emptyPodcastForm());
      return;
    }
    fetchAdminPodcastForm(episodeId)
      .then(setForm)
      .catch((err) => toast.error(err.message));
  }, [open, episodeId]);

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    try {
      const url = await uploadPodcastCover(file);
      setForm((f) => ({ ...f, coverUrl: url }));
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
      await savePodcast(episodeId, form);
      toast.success("Episode saved");
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
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{episodeId ? "Edit episode" : "New episode"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="playback">Playback</TabsTrigger>
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
                  <Input
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="Extension, Agriculture…"
                  />
                </div>
              </div>
              <div>
                <Label>Guest</Label>
                <Input value={form.guest} onChange={(e) => setForm((f) => ({ ...f, guest: e.target.value }))} />
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
                  <Label>Duration (seconds)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.durationSeconds}
                    onChange={(e) => setForm((f) => ({ ...f, durationSeconds: e.target.value }))}
                  />
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
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2">
                  <Switch checked={form.isPublished} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} />
                  <span className="text-sm">Published</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} />
                  <span className="text-sm">Featured episode</span>
                </label>
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-4 space-y-3">
              <div>
                <Label>Cover image</Label>
                {form.coverUrl && (
                  <img src={form.coverUrl} alt="" className="mb-3 h-32 w-32 rounded-xl object-cover" />
                )}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={uploadingCover} asChild>
                    <label className="cursor-pointer">
                      {uploadingCover ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Upload cover
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleCoverUpload(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </Button>
                </div>
                <Input
                  className="mt-2"
                  value={form.coverUrl}
                  onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))}
                  placeholder="Or paste cover URL"
                />
              </div>
            </TabsContent>

            <TabsContent value="playback" className="mt-4 space-y-3">
              <div>
                <Label>Embed URL</Label>
                <Input
                  value={form.embedUrl}
                  onChange={(e) => setForm((f) => ({ ...f, embedUrl: e.target.value }))}
                  placeholder="https://open.spotify.com/embed/episode/…"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Spotify, Apple Podcasts, or other iframe embed URL. Takes priority over direct audio.
                </p>
              </div>
              <div>
                <Label>Audio URL</Label>
                <Input
                  value={form.audioUrl}
                  onChange={(e) => setForm((f) => ({ ...f, audioUrl: e.target.value }))}
                  placeholder="https://…/episode.mp3"
                />
                <p className="mt-1 text-xs text-muted-foreground">Direct MP3 or hosted audio file URL.</p>
              </div>
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full grad-crimson text-white" disabled={saving}>
            {saving ? "Saving…" : "Save episode"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
