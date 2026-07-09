/** Identifiers for configurable home sections (maps to a future `home_sections` table). */
export type HomeSectionId =
  | "programs"
  | "events"
  | "publications"
  | "podcast"
  | "market"
  | "impact";

export type HomeSectionMeta = {
  id: HomeSectionId;
  eyebrow: string | null;
  title: string;
  viewAllRoute: string | null;
  viewAllLabel: string | null;
  emptyTitle: string | null;
  emptyDescription: string | null;
};

export type HomeImpactMetricId = "events" | "publications" | "markets" | "partners";

export type HomeImpactMetricDef = {
  id: HomeImpactMetricId;
  label: string;
};

/**
 * Default section copy and labels.
 * Replace `fetchHomeSectionMeta()` with a Supabase query when CMS tables exist.
 */
const DEFAULT_SECTION_META: Record<HomeSectionId, HomeSectionMeta> = {
  programs: {
    id: "programs",
    eyebrow: null,
    title: "Featured programs",
    viewAllRoute: "/programs",
    viewAllLabel: "See all",
    emptyTitle: null,
    emptyDescription: null,
  },
  events: {
    id: "events",
    eyebrow: null,
    title: "Upcoming events",
    viewAllRoute: "/events",
    viewAllLabel: "View all",
    emptyTitle: null,
    emptyDescription: null,
  },
  publications: {
    id: "publications",
    eyebrow: null,
    title: "Latest publications",
    viewAllRoute: "/publications",
    viewAllLabel: "View all",
    emptyTitle: null,
    emptyDescription: null,
  },
  podcast: {
    id: "podcast",
    eyebrow: null,
    title: "Featured podcast",
    viewAllRoute: "/podcast",
    viewAllLabel: "All episodes",
    emptyTitle: null,
    emptyDescription: null,
  },
  market: {
    id: "market",
    eyebrow: null,
    title: "Farmers markets",
    viewAllRoute: "/markets",
    viewAllLabel: "View all",
    emptyTitle: "Farmers markets coming soon",
    emptyDescription: "Locally grown food and community markets served by CISC Extension.",
  },
  impact: {
    id: "impact",
    eyebrow: null,
    title: "Community impact",
    viewAllRoute: null,
    viewAllLabel: null,
    emptyTitle: null,
    emptyDescription: null,
  },
};

/** Default impact metric labels (maps to a future `home_impact_metrics` table). */
export const DEFAULT_IMPACT_METRICS: HomeImpactMetricDef[] = [
  { id: "events", label: "Upcoming events" },
  { id: "publications", label: "Publications" },
  { id: "markets", label: "Farmers markets" },
  { id: "partners", label: "Community partners" },
];

export async function fetchHomeSectionMeta(): Promise<Record<HomeSectionId, HomeSectionMeta>> {
  // Future: const { data } = await supabase.from("home_sections").select("*").eq("is_published", true);
  return DEFAULT_SECTION_META;
}
