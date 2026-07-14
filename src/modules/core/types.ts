/** JESUP platform module identifiers. */
export type ModuleId =
  | "dashboard"
  | "programs"
  | "events"
  | "markets"
  | "publications"
  | "podcasts"
  | "partners"
  | "news"
  | "donations"
  | "equipment"
  | "grants"
  | "surveys"
  | "internships"
  | "twofas"
  | "volunteers"
  | "members"
  | "organizations"
  | "counties"
  | "ai"
  | "analytics"
  | "reports"
  | "activity"
  | "roles"
  | "settings"
  | "media"
  | "search"
  | "notifications";

export type PlatformModule = {
  id: ModuleId;
  label: string;
  description: string;
  publicRoute?: string;
  adminRoute?: string;
  /** Future mobile / AI integration hook */
  aiEnabled?: boolean;
};

export type ContentEntityType =
  | "program"
  | "event"
  | "market"
  | "publication"
  | "podcast"
  | "partner"
  | "grant"
  | "equipment"
  | "survey"
  | "internship"
  | "twofas";

export type ContentStatus = "draft" | "published" | "archived" | "inactive";

export type SeoMeta = {
  title?: string | null;
  description?: string | null;
  keywords?: string[] | null;
  ogImage?: string | null;
};

export type ContentMeta = {
  status: ContentStatus;
  isFeatured: boolean;
  seo: SeoMeta;
  tags: string[];
};
