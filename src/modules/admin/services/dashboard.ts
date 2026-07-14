import { supabase } from "@/integrations/supabase/client";
import { DASHBOARD_WIDGETS } from "../config/nav-items";

export type DashboardCounts = Record<string, number>;

export async function fetchDashboardCounts(): Promise<DashboardCounts> {
  const counts: DashboardCounts = {};

  await Promise.all(
    DASHBOARD_WIDGETS.map(async (widget) => {
      if (widget.countQuery === "registrations") {
        const { count } = await supabase
          .from("event_registrations")
          .select("*", { count: "exact", head: true })
          .eq("status", "registered");
        counts[widget.key] = count ?? 0;
        return;
      }

      if (widget.countQuery === "pending_approvals") {
        const [equipment, internships] = await Promise.all([
          supabase
            .from("equipment_checkouts")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("internship_applications")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
        ]);
        counts[widget.key] = (equipment.count ?? 0) + (internships.count ?? 0);
        return;
      }

      if (widget.countQuery === "media" && widget.table) {
        const { count } = await supabase
          .from(widget.table)
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);
        counts[widget.key] = count ?? 0;
        return;
      }

      if (widget.table) {
        const { count } = await supabase
          .from(widget.table)
          .select("*", { count: "exact", head: true });
        counts[widget.key] = count ?? 0;
      }
    }),
  );

  return counts;
}

export async function fetchAnalyticsSummary() {
  const [
    programs,
    events,
    markets,
    publications,
    podcasts,
    partners,
    registrations,
    pendingEquipment,
    pendingInternships,
    users,
    media,
  ] = await Promise.all([
    supabase.from("programs").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("markets").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("publications").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("podcast_episodes").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("partners").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("event_registrations").select("*", { count: "exact", head: true }),
    supabase.from("equipment_checkouts").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("internship_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("media_assets").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  return {
    programs: programs.count ?? 0,
    events: events.count ?? 0,
    markets: markets.count ?? 0,
    publications: publications.count ?? 0,
    podcasts: podcasts.count ?? 0,
    partners: partners.count ?? 0,
    registrations: registrations.count ?? 0,
    pendingApprovals: (pendingEquipment.count ?? 0) + (pendingInternships.count ?? 0),
    users: users.count ?? 0,
    media: media.count ?? 0,
  };
}
