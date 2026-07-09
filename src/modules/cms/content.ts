import type { ContentMeta, ContentStatus, SeoMeta } from "./types";
import { DEFAULT_CONTENT_META } from "./types";

/** Extract unified content metadata from any entity row. */
export function extractContentMeta(row: Record<string, unknown>): ContentMeta {
  const metadata = (row.metadata as Record<string, unknown>) ?? {};
  const seo = (metadata.seo as SeoMeta) ?? DEFAULT_CONTENT_META.seo;

  let status: ContentStatus = "published";
  if (row.is_active === false || row.status === "draft" || row.is_published === false) {
    status = row.status === "archived" ? "archived" : row.is_active === false ? "inactive" : "draft";
  }

  return {
    status,
    isFeatured: Boolean(row.is_featured),
    seo: {
      title: seo.title ?? (row.seo_title as string | null) ?? null,
      description: seo.description ?? (row.seo_description as string | null) ?? null,
      keywords: seo.keywords ?? [],
      ogImage: seo.ogImage ?? (row.og_image_url as string | null) ?? null,
    },
    tags: (metadata.tags as string[]) ?? [],
  };
}

/** Build metadata JSONB payload for saving. */
export function buildMetadataPayload(meta: Partial<ContentMeta>): Record<string, unknown> {
  return {
    seo: meta.seo ?? DEFAULT_CONTENT_META.seo,
    tags: meta.tags ?? [],
  };
}

export function isPublished(meta: ContentMeta) {
  return meta.status === "published";
}

export function isFeatured(meta: ContentMeta) {
  return meta.isFeatured;
}
