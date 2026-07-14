import { createLazyFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CommandCenterContentShell, CommandCenterPageHeader } from "@/modules/admin";
import {
  fetchMediaAssets,
  uploadMediaAsset,
  deleteMediaAsset,
  MEDIA_TYPE_LABELS,
  type MediaAssetType,
} from "@/modules/cms";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminDelete } from "@/hooks/use-admin-delete";
import { toast } from "sonner";
import { toastActionError } from "@/lib/seo";
import { Loader2, Trash2, Upload } from "lucide-react";

export const Route = createLazyFileRoute("/_authenticated/admin/media")({ component: AdminMedia });

function AdminMedia() {
  const qc = useQueryClient();
  const { confirmAndDelete, dialog } = useAdminDelete();
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<MediaAssetType | "all">("all");
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState<MediaAssetType>("image");

  const { data: assets, isLoading } = useQuery({
    queryKey: ["media-assets", filterType],
    queryFn: () => fetchMediaAssets({ assetType: filterType === "all" ? undefined : filterType, activeOnly: false }),
  });

  const filtered = (assets ?? []).filter(
    (a) => !q || a.name.toLowerCase().includes(q.toLowerCase()) || a.tags.some((t) => t.includes(q.toLowerCase())),
  );

  async function handleUpload(file: File) {
    if (!uploadName.trim()) return toast.error("Enter a name for the asset");
    setUploading(true);
    try {
      await uploadMediaAsset(file, { name: uploadName.trim(), assetType: uploadType });
      toast.success("Asset uploaded");
      setUploadName("");
      qc.invalidateQueries({ queryKey: ["media-assets"] });
      qc.invalidateQueries({ queryKey: ["command-center-counts"] });
    } catch (err) {
      toastActionError("Upload asset", err);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    await confirmAndDelete({
      entityLabel: "media asset",
      itemName: name,
      onDelete: () => deleteMediaAsset(id),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["media-assets"] }),
    });
  }

  return (
    <CommandCenterContentShell>
      <CommandCenterPageHeader
        title="Media Library"
        description="Global media manager — images, videos, PDFs, audio, and documents reusable across every module."
        searchValue={q}
        onSearchChange={setQ}
      />

      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Asset name</Label>
              <Input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="Hero image, factsheet PDF…" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={uploadType} onValueChange={(v) => setUploadType(v as MediaAssetType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(MEDIA_TYPE_LABELS) as MediaAssetType[]).map((type) => (
                    <SelectItem key={type} value={type}>{MEDIA_TYPE_LABELS[type]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm hover:bg-secondary/60">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload file
                <input
                  id="media-library-upload"
                  name="mediaFile"
                  type="file"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUpload(f);
                  }}
                />
              </label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filterType} onValueChange={(v) => setFilterType(v as MediaAssetType | "all")}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Filter type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(Object.keys(MEDIA_TYPE_LABELS) as MediaAssetType[]).map((type) => (
                  <SelectItem key={type} value={type}>{MEDIA_TYPE_LABELS[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading media…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No media assets match your filters.</p>
        )}
        {filtered.map((asset) => (
          <Card key={asset.id}>
            <CardContent className="space-y-3 p-4">
              <div className="aspect-video overflow-hidden rounded-lg bg-secondary">
                {asset.assetType === "image" ? (
                  <img src={asset.url} alt={asset.altText ?? asset.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {MEDIA_TYPE_LABELS[asset.assetType]}
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium">{asset.name}</div>
                <div className="text-xs text-muted-foreground">{MEDIA_TYPE_LABELS[asset.assetType]}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleDelete(asset.id, asset.name)}
                aria-label={`Delete ${asset.name}`}
              >
                <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {dialog}
    </CommandCenterContentShell>
  );
}
