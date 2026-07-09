import { createFileRoute } from "@tanstack/react-router";
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
import { toast } from "sonner";
import { Loader2, Trash2, Upload } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/media")({ component: AdminMedia });

function AdminMedia() {
  const qc = useQueryClient();
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
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this media asset?")) return;
    try {
      await deleteMediaAsset(id);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["media-assets"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
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
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold text-foreground">Upload asset</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Name</Label>
              <Input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="Asset name" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={uploadType} onValueChange={(v) => setUploadType(v as MediaAssetType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MEDIA_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Choose file
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(file);
                  }}
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex gap-2">
        <Button variant={filterType === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterType("all")}>
          All
        </Button>
        {Object.entries(MEDIA_TYPE_LABELS).map(([value, label]) => (
          <Button
            key={value}
            variant={filterType === value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(value as MediaAssetType)}
          >
            {label}
          </Button>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">Loading media…</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((asset) => (
          <Card key={asset.id} className="overflow-hidden">
            <div className="aspect-video bg-secondary">
              {asset.assetType === "image" || asset.assetType === "logo" || asset.assetType === "magazine_cover" ? (
                <img src={asset.url} alt={asset.altText ?? asset.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                  {MEDIA_TYPE_LABELS[asset.assetType]}
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="font-medium text-foreground">{asset.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{MEDIA_TYPE_LABELS[asset.assetType]}</div>
              {asset.moduleContext && (
                <div className="mt-1 text-xs text-primary">{asset.moduleContext}</div>
              )}
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => handleDelete(asset.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {!isLoading && filtered.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">No media assets yet.</p>
      )}
    </CommandCenterContentShell>
  );
}
