import type { LucideIcon } from "lucide-react";
import {
  MapPin,
  Calendar,
  BookOpen,
  DollarSign,
  Briefcase,
  Package,
  ClipboardList,
  Users,
  GraduationCap,
  Mic,
  Building2,
  LayoutGrid,
  Image,
  Search,
  Bell,
  Settings,
  BarChart3,
  Newspaper,
  HeartHandshake,
  UserCircle,
  Landmark,
  Map,
  Activity,
  Shield,
  Home,
} from "lucide-react";
import type { ModuleId } from "@/modules/core";

export type CommandCenterNavGroupId =
  | "overview"
  | "content"
  | "operations"
  | "community"
  | "analytics"
  | "system";

export type CommandCenterNavItem = {
  moduleId: ModuleId;
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  group: CommandCenterNavGroupId;
};

export type DashboardWidget = {
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
  table?: string;
  countQuery?: "table" | "registrations" | "pending_approvals" | "media" | "notifications";
  group: "content" | "operations" | "platform";
};

/** Single source of truth for Command Center sidebar navigation. */
export const COMMAND_CENTER_NAV: CommandCenterNavItem[] = [
  { moduleId: "dashboard", to: "/admin", label: "Dashboard", icon: Home, exact: true, group: "overview" },

  { moduleId: "programs", to: "/admin/programs", label: "Programs", icon: LayoutGrid, group: "content" },
  { moduleId: "events", to: "/admin/events", label: "Events", icon: Calendar, group: "content" },
  { moduleId: "publications", to: "/admin/publications", label: "Publications", icon: BookOpen, group: "content" },
  { moduleId: "markets", to: "/admin/markets", label: "Markets", icon: MapPin, group: "content" },
  { moduleId: "podcasts", to: "/admin/podcasts", label: "Podcasts", icon: Mic, group: "content" },
  { moduleId: "partners", to: "/admin/partners", label: "Partners", icon: Building2, group: "content" },
  { moduleId: "news", to: "/admin/news", label: "News", icon: Newspaper, group: "content" },

  { moduleId: "twofas", to: "/admin/2fas/applications", label: "2FAS", icon: GraduationCap, group: "operations" },
  { moduleId: "internships", to: "/admin/internships", label: "Internships", icon: Briefcase, group: "operations" },
  { moduleId: "equipment", to: "/admin/equipment", label: "Equipment", icon: Package, group: "operations" },
  { moduleId: "grants", to: "/admin/grants", label: "Grants", icon: DollarSign, group: "operations" },
  { moduleId: "surveys", to: "/admin/surveys", label: "Surveys", icon: ClipboardList, group: "operations" },

  { moduleId: "volunteers", to: "/admin/volunteers", label: "Volunteers", icon: HeartHandshake, group: "community" },
  { moduleId: "members", to: "/admin/members", label: "Members", icon: UserCircle, group: "community" },
  { moduleId: "organizations", to: "/admin/organizations", label: "Organizations", icon: Building2, group: "community" },
  { moduleId: "counties", to: "/admin/counties", label: "Counties", icon: Map, group: "community" },

  { moduleId: "reports", to: "/admin/reports", label: "Reports", icon: BarChart3, group: "analytics" },
  { moduleId: "notifications", to: "/admin/notifications", label: "Notifications", icon: Bell, group: "analytics" },
  { moduleId: "activity", to: "/admin/activity", label: "Activity", icon: Activity, group: "analytics" },
  { moduleId: "search", to: "/admin/search", label: "Search", icon: Search, group: "analytics" },

  { moduleId: "media", to: "/admin/media", label: "Media Library", icon: Image, group: "system" },
  { moduleId: "dashboard", to: "/admin/users", label: "Users", icon: Users, group: "system" },
  { moduleId: "roles", to: "/admin/roles", label: "Roles", icon: Shield, group: "system" },
  { moduleId: "settings", to: "/admin/settings", label: "Settings", icon: Settings, group: "system" },
];

export const COMMAND_CENTER_NAV_GROUPS: { id: CommandCenterNavGroupId; label: string }[] = [
  { id: "overview", label: "" },
  { id: "content", label: "Content" },
  { id: "operations", label: "Operations" },
  { id: "community", label: "Community" },
  { id: "analytics", label: "Analytics" },
  { id: "system", label: "System" },
];

/** Dashboard widget definitions. */
export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  { key: "programs", label: "Programs", to: "/admin/programs", icon: LayoutGrid, table: "programs", countQuery: "table", group: "content" },
  { key: "events", label: "Events", to: "/admin/events", icon: Calendar, table: "events", countQuery: "table", group: "content" },
  { key: "markets", label: "Markets", to: "/admin/markets", icon: MapPin, table: "markets", countQuery: "table", group: "content" },
  { key: "publications", label: "Publications", to: "/admin/publications", icon: BookOpen, table: "publications", countQuery: "table", group: "content" },
  { key: "podcast_episodes", label: "Podcasts", to: "/admin/podcasts", icon: Mic, table: "podcast_episodes", countQuery: "table", group: "content" },
  { key: "partners", label: "Partners", to: "/admin/partners", icon: Building2, table: "partners", countQuery: "table", group: "content" },
  { key: "profiles", label: "Users", to: "/admin/users", icon: Users, table: "profiles", countQuery: "table", group: "operations" },
  { key: "registrations", label: "Registrations", to: "/admin/events", icon: Calendar, countQuery: "registrations", group: "operations" },
  { key: "pending_approvals", label: "Pending Approvals", to: "/admin/equipment", icon: Package, countQuery: "pending_approvals", group: "operations" },
  { key: "equipment", label: "Equipment", to: "/admin/equipment", icon: Package, table: "equipment", countQuery: "table", group: "operations" },
  { key: "analytics", label: "Reports", to: "/admin/reports", icon: BarChart3, group: "platform" },
  { key: "media_assets", label: "Media Library", to: "/admin/media", icon: Image, table: "media_assets", countQuery: "media", group: "platform" },
];

export const COMMAND_CENTER_TITLE = "JESUP Command Center";
export const COMMAND_CENTER_SUBTITLE =
  "Powered by the Carver Integrative Sustainability Center";
