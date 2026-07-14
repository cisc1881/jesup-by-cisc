import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  MapPin,
  DollarSign,
  Package,
  ClipboardList,
  Building2,
  Heart,
  Mic,
  Briefcase,
  Newspaper,
  MessageSquare,
} from "lucide-react";

/** Routes that belong under the Resources tab (mobile) and hub page. */
export const RESOURCE_ROUTES = [
  "/resources",
  "/publications",
  "/markets",
  "/grants",
  "/equipment",
  "/surveys",
  "/partners",
  "/donate",
  "/podcasts",
  "/news",
  "/internships",
] as const;

export function isResourceRoute(pathname: string) {
  return RESOURCE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export type ResourceHubLink = {
  to: string;
  icon: LucideIcon;
  title: string;
  body: string;
};

export const resourceHubLinks: ResourceHubLink[] = [
  { to: "/join", icon: MessageSquare, title: "Join / Connect", body: "Connect with CISC programs, partnerships, and opportunities." },
  { to: "/publications", icon: BookOpen, title: "Publications", body: "Research briefs, community guides, and reports." },
  { to: "/markets", icon: MapPin, title: "Farmers markets", body: "Find local markets across Alabama." },
  { to: "/grants", icon: DollarSign, title: "Grants", body: "Funding for community and farm projects." },
  { to: "/equipment", icon: Package, title: "Equipment", body: "Reserve tools and equipment for your project." },
  { to: "/surveys", icon: ClipboardList, title: "Surveys", body: "Share your voice and shape our programs." },
  { to: "/partners", icon: Building2, title: "Partners", body: "Organizations and collaborators across the Black Belt." },
  { to: "/donate", icon: Heart, title: "Donate", body: "Support programs, students, and community impact." },
  { to: "/podcasts", icon: Mic, title: "Podcasts", body: "Conversations from the field and the community." },
  { to: "/news", icon: Newspaper, title: "News & stories", body: "Programs, research, Extension updates, and community impact." },
  { to: "/internships", icon: Briefcase, title: "Internships", body: "Apply for hands-on student and community internships." },
];

/** Desktop top nav — primary sections; secondary items live on /resources for mobile. */
export const desktopNavLinks = [
  { to: "/programs", label: "Programs" },
  { to: "/events", label: "Events" },
  { to: "/join", label: "Join / Connect" },
  { to: "/news", label: "News" },
  { to: "/resources", label: "Resources" },
  { to: "/podcasts", label: "Podcasts" },
  { to: "/partners", label: "Partners" },
  { to: "/donate", label: "Donate" },
] as const;
