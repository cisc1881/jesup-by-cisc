import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Calendar, BookOpen, DollarSign, Briefcase, Package, ClipboardList, Users, Mic, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({ component: AdminHome });

const tables = [
  { key: "markets", label: "Markets", to: "/admin/markets", icon: MapPin },
  { key: "events", label: "Events", to: "/admin/events", icon: Calendar },
  { key: "publications", label: "Publications", to: "/admin/publications", icon: BookOpen },
  { key: "grants", label: "Grants", to: "/admin/grants", icon: DollarSign },
  { key: "internships", label: "Internships", to: "/admin/internships", icon: Briefcase },
  { key: "equipment", label: "Equipment", to: "/admin/equipment", icon: Package },
  { key: "podcast_episodes", label: "Podcast", to: "/admin/podcast", icon: Mic },
  { key: "partners", label: "Partners", to: "/admin/partners", icon: Building2 },
  { key: "surveys", label: "Surveys", to: "/admin/surveys", icon: ClipboardList },
  { key: "profiles", label: "Users", to: "/admin/users", icon: Users },
] as const;

function AdminHome() {
  const { data: counts } = useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const results = await Promise.all(tables.map(async (t) => {
        const { count } = await supabase.from(t.key).select("*", { count: "exact", head: true });
        return [t.key, count ?? 0] as const;
      }));
      return Object.fromEntries(results) as Record<string, number>;
    },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <span className="gold-bar mb-3" />
      <h1 className="font-serif text-3xl font-bold text-primary">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Overview of everything in CISC Connect.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tables.map((t) => (
          <Link key={t.key} to={t.to}>
            <Card className="transition hover:shadow-md">
              <CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground"><span>{t.label}</span><t.icon className="h-4 w-4 text-accent" /></CardTitle></CardHeader>
              <CardContent><div className="font-serif text-3xl font-bold text-primary">{counts?.[t.key] ?? "—"}</div></CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
