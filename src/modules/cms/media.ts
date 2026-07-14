import { supabase } from "@/integrations/supabase/client";
import type { MediaAsset, MediaAssetType } from "./types";

export const MEDIA_LIBRARY_BUCKET = "media-library";

export const MEDIA_TYPE_LABELS: Record<MediaAssetType, string> = {
  image: "Images",
  video: "Videos",
  pdf: "PDFs",
  magazine_cover: "Magazine Covers",
  factsheet: "Factsheets",
  audio: "Audio",
  logo: "Logos",
  document: "Documents",
};

function mapRow(row: Record<string, unknown>): MediaAsset {
  return {
    id: row.id as string,
    name: row.name as string,
    assetType: row.asset_type as MediaAssetType,
    url: row.url as string,
    bucket: (row.bucket as string | null) ?? null,
    storagePath: (row.storage_path as string | null) ?? null,
    mimeType: (row.mime_type as string | null) ?? null,
    fileSize: (row.file_size as number | null) ?? null,
    altText: (row.alt_text as string | null) ?? null,
    caption: (row.caption as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    moduleContext: (row.module_context as string | null) ?? null,
    tags: (row.tags as string[]) ?? [],
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
  };
}

export async function fetchMediaAssets(options?: {
  assetType?: MediaAssetType;
  moduleContext?: string;
  activeOnly?: boolean;
}) {
  let query = supabase.from("media_assets").select("*").order("created_at", { ascending: false });
  if (options?.assetType) query = query.eq("asset_type", options.assetType);
  if (options?.moduleContext) query = query.eq("module_context", options.moduleContext);
  if (options?.activeOnly !== false) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function uploadMediaAsset(
  file: File,
  options: { name: string; assetType: MediaAssetType; moduleContext?: string; altText?: string },
) {
  const path = `${options.assetType}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error: uploadError } = await supabase.storage
    .from(MEDIA_LIBRARY_BUCKET)
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from(MEDIA_LIBRARY_BUCKET).getPublicUrl(path);
  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      name: options.name,
      asset_type: options.assetType,
      url: urlData.publicUrl,
      bucket: MEDIA_LIBRARY_BUCKET,
      storage_path: path,
      mime_type: file.type || null,
      file_size: file.size,
      alt_text: options.altText || null,
      module_context: options.moduleContext || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function deleteMediaAsset(id: string) {
  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) throw error;
}

export async function getMediaAssetCounts() {
  const types = Object.keys(MEDIA_TYPE_LABELS) as MediaAssetType[];
  const results = await Promise.all(
    types.map(async (type) => {
      const { count } = await supabase
        .from("media_assets")
        .select("*", { count: "exact", head: true })
        .eq("asset_type", type)
        .eq("is_active", true);
      return [type, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(results) as Record<MediaAssetType, number>;
}
