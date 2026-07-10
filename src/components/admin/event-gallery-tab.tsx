import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingState, QueryErrorState } from "@/components/design-system";
import {
  deleteEventGalleryItem,
  getEventGallerySummary,
  listEventGallery,
  PHOTO_RELEASE_OPTIONS,
  reorderEventGallery,
  setEventCoverImage,
  updateEventGalleryItem,
  uploadAdminEventImages,
  validateGalleryFile,
  type EventGalleryItem,
} from "@/lib/event-gallery";
import {
  adminEventGalleryQueryKey,
  eventGallerySummaryQueryKey,
  pendingGallerySubmissionsQueryKey,
  publicEventGalleryQueryKey,
} from "@/lib/query-config";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  ImageIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";

type EventGalleryTabProps = {
  eventId: string;
};

type PendingUpload = {
  id: string;
  file: File;
  previewUrl: string;
  error: string | null;
};

function invalidateGalleryQueries(qc: ReturnType<typeof useQueryClient>, eventId: string) {
  void qc.invalidateQueries({ queryKey: adminEventGalleryQueryKey(eventId) });
  void qc.invalidateQueries({ queryKey: publicEventGalleryQueryKey(eventId) });
  void qc.invalidateQueries({ queryKey: eventGallerySummaryQueryKey(eventId) });
  void qc.invalidateQueries({ queryKey: pendingGallerySubmissionsQueryKey(eventId) });
  void qc.invalidateQueries({ queryKey: pendingGallerySubmissionsQueryKey() });
}

export function EventGalleryTab({ eventId }: EventGalleryTabProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<EventGalleryItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    caption: "",
    altText: "",
    photographerOrSource: "",
    photoReleaseStatus: "",
    isPublicApproved: true,
  });
  const [statusMessage, setStatusMessage] = useState("");

  const {
    data: items = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: adminEventGalleryQueryKey(eventId),
    queryFn: () => listEventGallery(eventId),
  });

  const { data: summary } = useQuery({
    queryKey: eventGallerySummaryQueryKey(eventId),
    queryFn: () => getEventGallerySummary(eventId),
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setUploadProgress(`Uploading 0 of ${files.length}…`);
      return uploadAdminEventImages(eventId, files, {
        onProgress: (completed, total) => {
          setUploadProgress(`Uploading ${completed} of ${total}…`);
        },
      });
    },
    onSuccess: (result) => {
      invalidateGalleryQueries(qc, eventId);
      setPendingUploads([]);
      setUploadProgress(null);
      if (result.succeeded.length > 0) {
        toast.success(`${result.succeeded.length} image${result.succeeded.length === 1 ? "" : "s"} uploaded`);
        setStatusMessage(`${result.succeeded.length} image${result.succeeded.length === 1 ? "" : "s"} uploaded successfully.`);
      }
      if (result.failures.length > 0) {
        toast.error(`${result.failures.length} upload${result.failures.length === 1 ? "" : "s"} failed`);
        setStatusMessage(
          `${result.failures.length} failed: ${result.failures.map((f) => `${f.fileName} (${f.error})`).join("; ")}`,
        );
      }
    },
    onError: (err) => {
      setUploadProgress(null);
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setStatusMessage(err instanceof Error ? err.message : "Upload failed");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateEventGalleryItem>[1] }) =>
      updateEventGalleryItem(id, updates),
    onSuccess: () => {
      invalidateGalleryQueries(qc, eventId);
      setEditingId(null);
      toast.success("Image updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  const coverMutation = useMutation({
    mutationFn: (itemId: string) => setEventCoverImage(eventId, itemId),
    onSuccess: () => {
      invalidateGalleryQueries(qc, eventId);
      toast.success("Cover image updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not set cover"),
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => deleteEventGalleryItem(itemId, eventId),
    onSuccess: () => {
      invalidateGalleryQueries(qc, eventId);
      toast.success("Image deleted");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => reorderEventGallery(eventId, orderedIds),
    onSuccess: () => {
      invalidateGalleryQueries(qc, eventId);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Reorder failed"),
  });

  const handleFilesSelected = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return;
    const next: PendingUpload[] = [];
    for (const file of Array.from(fileList)) {
      const error = validateGalleryFile(file);
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        previewUrl: URL.createObjectURL(file),
        error,
      });
    }
    setPendingUploads((prev) => [...prev, ...next]);
    setStatusMessage(`${next.length} file${next.length === 1 ? "" : "s"} selected for upload.`);
  }, []);

  function startEdit(item: EventGalleryItem) {
    setEditingId(item.id);
    setEditDraft({
      caption: item.caption ?? "",
      altText: item.altText ?? "",
      photographerOrSource: item.photographerOrSource ?? "",
      photoReleaseStatus: item.photoReleaseStatus ?? "",
      isPublicApproved: item.isPublicApproved,
    });
  }

  function saveEdit(itemId: string) {
    if (editDraft.isPublicApproved && !editDraft.altText.trim()) {
      toast.warning("Add alt text before publicly approving this image.");
    }
    updateMutation.mutate({
      id: itemId,
      updates: {
        caption: editDraft.caption.trim() || null,
        altText: editDraft.altText.trim() || null,
        photographerOrSource: editDraft.photographerOrSource.trim() || null,
        photoReleaseStatus: editDraft.photoReleaseStatus || null,
        isPublicApproved: editDraft.isPublicApproved,
      },
    });
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const ordered = [...items];
    const [removed] = ordered.splice(index, 1);
    ordered.splice(target, 0, removed);
    reorderMutation.mutate(ordered.map((item) => item.id));
  }

  function uploadPending() {
    const valid = pendingUploads.filter((p) => !p.error).map((p) => p.file);
    if (valid.length === 0) {
      toast.error("No valid images to upload");
      return;
    }
    uploadMutation.mutate(valid);
  }

  if (isLoading) return <LoadingState label="Loading gallery…" />;
  if (isError) return <QueryErrorState title="Couldn't load gallery" onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{summary?.totalImages ?? 0} images</Badge>
          <Badge variant="secondary">{summary?.approvedImages ?? 0} public</Badge>
          {(summary?.pendingSubmissions ?? 0) > 0 && (
            <Badge>
              {summary?.pendingSubmissions} pending submission{(summary?.pendingSubmissions ?? 0) === 1 ? "" : "s"}
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/events/gallery" search={{ eventId }}>
            Review submissions
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Select images
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={["image/jpeg", "image/png", "image/webp", "image/gif"].join(",")}
              multiple
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />
            {pendingUploads.length > 0 && (
              <Button
                type="button"
                onClick={uploadPending}
                disabled={uploadMutation.isPending || pendingUploads.every((p) => p.error)}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploadProgress ?? "Uploading…"}
                  </>
                ) : (
                  <>Upload {pendingUploads.filter((p) => !p.error).length} image(s)</>
                )}
              </Button>
            )}
          </div>

          <div aria-live="polite" className="text-sm text-muted-foreground">
            {statusMessage}
          </div>

          {pendingUploads.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingUploads.map((pending) => (
                <div key={pending.id} className="rounded-lg border p-3">
                  <img
                    src={pending.previewUrl}
                    alt=""
                    className="aspect-[4/3] w-full rounded-md object-cover"
                  />
                  <p className="mt-2 truncate text-sm font-medium">{pending.file.name}</p>
                  {pending.error ? (
                    <p className="text-sm text-destructive">{pending.error}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ready to upload</p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      URL.revokeObjectURL(pending.previewUrl);
                      setPendingUploads((prev) => prev.filter((p) => p.id !== pending.id));
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No gallery images yet"
          description="Upload photos to build the event gallery."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <Card key={item.id} className={item.isCover ? "ring-2 ring-primary" : undefined}>
              <CardContent className="space-y-3 p-3">
                <div className="relative">
                  <img
                    src={item.imageUrl}
                    alt={item.altText ?? item.caption ?? ""}
                    className="aspect-[4/3] w-full rounded-lg object-cover"
                  />
                  <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                    {item.isCover && <Badge>Cover</Badge>}
                    {!item.isPublicApproved && <Badge variant="secondary">Hidden</Badge>}
                    {item.source === "participant" && <Badge variant="outline">Participant</Badge>}
                  </div>
                </div>

                {editingId === item.id ? (
                  <div className="space-y-2">
                    <div>
                      <Label>Caption</Label>
                      <Input
                        value={editDraft.caption}
                        onChange={(e) => setEditDraft((d) => ({ ...d, caption: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Alt text</Label>
                      <Input
                        value={editDraft.altText}
                        onChange={(e) => setEditDraft((d) => ({ ...d, altText: e.target.value }))}
                      />
                      {!editDraft.altText.trim() && editDraft.isPublicApproved && (
                        <p className="mt-1 text-xs text-amber-700">
                          Alt text is required for accessible public display.
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Photographer / source</Label>
                      <Input
                        value={editDraft.photographerOrSource}
                        onChange={(e) => setEditDraft((d) => ({ ...d, photographerOrSource: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Photo release</Label>
                      <Select
                        value={editDraft.photoReleaseStatus || "none"}
                        onValueChange={(v) =>
                          setEditDraft((d) => ({ ...d, photoReleaseStatus: v === "none" ? "" : v }))
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PHOTO_RELEASE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value || "none"} value={opt.value || "none"}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editDraft.isPublicApproved}
                        onCheckedChange={(v) => setEditDraft((d) => ({ ...d, isPublicApproved: v }))}
                        id={`public-${item.id}`}
                      />
                      <Label htmlFor={`public-${item.id}`}>Publicly approved</Label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" onClick={() => saveEdit(item.id)} disabled={updateMutation.isPending}>
                        Save
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {item.caption && <p className="text-sm font-medium">{item.caption}</p>}
                    {item.altText && <p className="text-xs text-muted-foreground">Alt: {item.altText}</p>}
                    <div className="flex flex-wrap gap-1">
                      <Button type="button" size="sm" variant="outline" onClick={() => startEdit(item)}>
                        Edit
                      </Button>
                      <Button type="button" size="icon" variant="outline" aria-label="Preview" onClick={() => setPreviewItem(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!item.isCover && (
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          aria-label="Set as cover"
                          onClick={() => coverMutation.mutate(item.id)}
                          disabled={coverMutation.isPending}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label="Move up"
                        disabled={index === 0 || reorderMutation.isPending}
                        onClick={() => moveItem(index, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label="Move down"
                        disabled={index === items.length - 1 || reorderMutation.isPending}
                        onClick={() => moveItem(index, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Delete image"
                        onClick={() => deleteMutation.mutate(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.caption || "Gallery preview"}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <img
              src={previewItem.imageUrl}
              alt={previewItem.altText ?? previewItem.caption ?? "Event photo"}
              className="max-h-[70vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
