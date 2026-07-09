import type { ModuleId, PlatformModule } from "./types";

/** Central registry of all JESUP platform modules. */
export const PLATFORM_MODULES: Record<ModuleId, PlatformModule> = {
  dashboard: {
    id: "dashboard",
    label: "Dashboard",
    description: "Command Center overview and widgets",
    adminRoute: "/admin",
  },
  programs: {
    id: "programs",
    label: "Programs",
    description: "Cooperative Extension programs",
    publicRoute: "/programs",
    adminRoute: "/admin/programs",
    aiEnabled: true,
  },
  events: {
    id: "events",
    label: "Events",
    description: "Workshops, trainings, and community events",
    publicRoute: "/events",
    adminRoute: "/admin/events",
    aiEnabled: true,
  },
  markets: {
    id: "markets",
    label: "Farmers Markets",
    description: "Local farmers market directory",
    publicRoute: "/markets",
    adminRoute: "/admin/markets",
    aiEnabled: true,
  },
  publications: {
    id: "publications",
    label: "Publications",
    description: "Factsheets, reports, and extension bulletins",
    publicRoute: "/publications",
    adminRoute: "/admin/publications",
    aiEnabled: true,
  },
  podcasts: {
    id: "podcasts",
    label: "Podcasts",
    description: "Podcast episodes and audio content",
    publicRoute: "/podcast",
    adminRoute: "/admin/podcast",
    aiEnabled: true,
  },
  partners: {
    id: "partners",
    label: "Partners",
    description: "Community and organizational partners",
    publicRoute: "/partners",
    adminRoute: "/admin/partners",
  },
  donations: {
    id: "donations",
    label: "Donations",
    description: "Donation and giving portal",
    publicRoute: "/donate",
  },
  equipment: {
    id: "equipment",
    label: "Equipment",
    description: "Equipment checkout and inventory",
    publicRoute: "/equipment",
    adminRoute: "/admin/equipment",
  },
  grants: {
    id: "grants",
    label: "Grants",
    description: "Grant opportunities and funding",
    publicRoute: "/grants",
    adminRoute: "/admin/grants",
  },
  surveys: {
    id: "surveys",
    label: "Surveys",
    description: "Qualtrics and survey management",
    publicRoute: "/surveys",
    adminRoute: "/admin/surveys",
  },
  internships: {
    id: "internships",
    label: "Internships",
    description: "Internship programs and applications",
    publicRoute: "/internships",
    adminRoute: "/admin/internships",
  },
  twofas: {
    id: "twofas",
    label: "2FAS",
    description: "Two-factor authentication services",
    aiEnabled: false,
  },
  ai: {
    id: "ai",
    label: "AI",
    description: "AI services and integrations",
    adminRoute: "/admin/settings",
    aiEnabled: true,
  },
  analytics: {
    id: "analytics",
    label: "Analytics",
    description: "Platform analytics and reporting",
    adminRoute: "/admin/analytics",
    aiEnabled: true,
  },
  settings: {
    id: "settings",
    label: "Settings",
    description: "System and organization settings",
    adminRoute: "/admin/settings",
  },
  media: {
    id: "media",
    label: "Media Library",
    description: "Global media manager for all modules",
    adminRoute: "/admin/media",
  },
  search: {
    id: "search",
    label: "Search",
    description: "Global content search",
    adminRoute: "/admin/search",
    aiEnabled: true,
  },
  notifications: {
    id: "notifications",
    label: "Notifications",
    description: "Notification center for push, email, SMS, and in-app",
    adminRoute: "/admin/notifications",
  },
};

export function getModule(id: ModuleId): PlatformModule {
  return PLATFORM_MODULES[id];
}

export function getContentModules(): PlatformModule[] {
  return [
    PLATFORM_MODULES.programs,
    PLATFORM_MODULES.events,
    PLATFORM_MODULES.markets,
    PLATFORM_MODULES.publications,
    PLATFORM_MODULES.podcasts,
    PLATFORM_MODULES.partners,
    PLATFORM_MODULES.grants,
  ];
}
