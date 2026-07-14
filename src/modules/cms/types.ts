import type { ContentEntityType, ContentMeta, ContentStatus, SeoMeta } from "@/modules/core";

export type { ContentMeta, ContentStatus, SeoMeta };

export type MediaAssetType =
  | "image"
  | "video"
  | "pdf"
  | "magazine_cover"
  | "factsheet"
  | "audio"
  | "logo"
  | "document";

export type MediaAsset = {
  id: string;
  name: string;
  assetType: MediaAssetType;
  url: string;
  bucket: string | null;
  storagePath: string | null;
  mimeType: string | null;
  fileSize: number | null;
  altText: string | null;
  caption: string | null;
  metadata: Record<string, unknown>;
  moduleContext: string | null;
  tags: string[];
  isActive: boolean;
  createdAt: string;
};

export type ContentTag = {
  id: string;
  name: string;
  slug: string;
};

export type SearchResult = {
  id: string;
  entityType: ContentEntityType;
  title: string;
  subtitle: string | null;
  href: string;
  hrefParams?: Record<string, string>;
  imageUrl: string | null;
  score: number;
};

export type RelationshipDef = {
  sourceType: ContentEntityType;
  targetType: ContentEntityType;
  junctionTable: string;
  sourceColumn: string;
  targetColumn: string;
  label: string;
};

export type NotificationRecord = import("@/modules/notifications/types").NotificationRecord;

export type PlatformSettingKey =
  | "organization"
  | "brand"
  | "homepage"
  | "navigation"
  | "maps"
  | "qualtrics"
  | "ai"
  | "email"
  | "storage";

export const DEFAULT_CONTENT_META: ContentMeta = {
  status: "draft",
  isFeatured: false,
  seo: { title: null, description: null, keywords: [], ogImage: null },
  tags: [],
};
