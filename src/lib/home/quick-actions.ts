import { BookOpen, Calendar, LayoutGrid, MapPin } from "lucide-react";
import type { HomeQuickAction } from "./types";

/** Route metadata for home quick actions — labels match primary nav sections. */
export const HOME_QUICK_ACTIONS: HomeQuickAction[] = [
  { to: "/programs", label: "Programs", icon: LayoutGrid },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/publications", label: "Publications", icon: BookOpen },
  { to: "/markets", label: "Farmers Markets", icon: MapPin },
];
