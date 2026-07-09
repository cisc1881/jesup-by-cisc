import { supabase } from "@/integrations/supabase/client";

export type CommandCenterMetrics = {
  activePrograms: number;
  upcomingEvents: number;
  activeMarkets: number;
  publications: number;
  pending2fasApplications: number;
  eventRegistrations: number;
};

export type CommandCenterActivityType =
  | "event_registration"
  | "twofas_application"
  | "publication"
  | "program"
  | "market";

export type CommandCenterActivityItem = {
  id: string;
  type: CommandCenterActivityType;
  title: string;
  subtitle: string | null;
  timestamp: string;
  linkTo: string;
};

export type CommandCenterPendingType =
  | "twofas_application"
  | "low_capacity_event"
  | "event_registration";

export type CommandCenterPendingItem = {
  id: string;
  type: CommandCenterPendingType;
  title: string;
  subtitle: string | null;
  meta: string | null;
  linkTo: string;
};

export type CommandCenterDashboardData = {
  metrics: CommandCenterMetrics;
  recentActivity: CommandCenterActivityItem[];
  pendingReview: CommandCenterPendingItem[];
};

async function fetchEventRegistrationCounts(eventIds: string[]) {
  const map = new Map<string, number>();
  await Promise.all(
    eventIds.map(async (id) => {
      const { data, error } = await supabase.rpc("get_event_registration_count", { p_event_id: id });
      if (!error) map.set(id, Number(data ?? 0));
    }),
  );
  return map;
}

export async function fetchCommandCenterDashboard(): Promise<CommandCenterDashboardData> {
  const now = new Date().toISOString();

  const [
    programsRes,
    eventsRes,
    marketsRes,
    publicationsRes,
    pending2fasRes,
    registrationsRes,
    recentRegsRes,
    recent2fasRes,
    recentPubsRes,
    recentProgramsRes,
    recentMarketsRes,
    pending2fasListRes,
    upcomingEventsRes,
    latestRegsRes,
  ] = await Promise.all([
    supabase.from("programs").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("status", "published")
      .gte("starts_at", now),
    supabase.from("markets").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("publications").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("internship_applications")
      .select("id, internships!inner(is_2fas)", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("internships.is_2fas", true),
    supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("status", "registered"),
    supabase
      .from("event_registrations")
      .select("id, created_at, events ( title ), profiles ( full_name )")
      .eq("status", "registered")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("internship_applications")
      .select("id, created_at, status, profiles ( full_name ), internships!inner ( title, is_2fas )")
      .eq("internships.is_2fas", true)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("publications")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("programs")
      .select("id, name, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("markets")
      .select("id, name, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("internship_applications")
      .select("id, created_at, profiles ( full_name ), internships!inner ( title, is_2fas )")
      .eq("status", "pending")
      .eq("internships.is_2fas", true)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("events")
      .select("id, title, slug, capacity, starts_at")
      .eq("is_active", true)
      .eq("status", "published")
      .gte("starts_at", now)
      .not("capacity", "is", null)
      .gt("capacity", 0)
      .order("starts_at", { ascending: true })
      .limit(15),
    supabase
      .from("event_registrations")
      .select("id, created_at, events ( title ), profiles ( full_name )")
      .eq("status", "registered")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const metrics: CommandCenterMetrics = {
    activePrograms: programsRes.count ?? 0,
    upcomingEvents: eventsRes.count ?? 0,
    activeMarkets: marketsRes.count ?? 0,
    publications: publicationsRes.count ?? 0,
    pending2fasApplications: pending2fasRes.count ?? 0,
    eventRegistrations: registrationsRes.count ?? 0,
  };

  const activity: CommandCenterActivityItem[] = [];

  for (const row of recentRegsRes.data ?? []) {
    const event = row.events as { title: string } | null;
    const profile = row.profiles as { full_name: string | null } | null;
    activity.push({
      id: `reg-${row.id}`,
      type: "event_registration",
      title: event?.title ?? "Event registration",
      subtitle: profile?.full_name ?? null,
      timestamp: row.created_at,
      linkTo: "/admin/events",
    });
  }

  for (const row of recent2fasRes.data ?? []) {
    const internship = row.internships as { title: string } | null;
    const profile = row.profiles as { full_name: string | null } | null;
    activity.push({
      id: `2fas-${row.id}`,
      type: "twofas_application",
      title: internship?.title ?? "2FAS application",
      subtitle: profile?.full_name ?? null,
      timestamp: row.created_at,
      linkTo: "/admin/2fas/applications",
    });
  }

  for (const row of recentPubsRes.data ?? []) {
    activity.push({
      id: `pub-${row.id}`,
      type: "publication",
      title: row.title,
      subtitle: "New publication",
      timestamp: row.created_at,
      linkTo: "/admin/publications",
    });
  }

  for (const row of recentProgramsRes.data ?? []) {
    activity.push({
      id: `prog-${row.id}`,
      type: "program",
      title: row.name,
      subtitle: "Program updated",
      timestamp: row.updated_at,
      linkTo: "/admin/programs",
    });
  }

  for (const row of recentMarketsRes.data ?? []) {
    activity.push({
      id: `mkt-${row.id}`,
      type: "market",
      title: row.name,
      subtitle: "New market listing",
      timestamp: row.created_at,
      linkTo: "/admin/markets",
    });
  }

  activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const recentActivity = activity.slice(0, 10);

  const pendingReview: CommandCenterPendingItem[] = [];

  for (const row of pending2fasListRes.data ?? []) {
    const internship = row.internships as { title: string } | null;
    const profile = row.profiles as { full_name: string | null } | null;
    pendingReview.push({
      id: `pending-2fas-${row.id}`,
      type: "twofas_application",
      title: profile?.full_name ?? "Applicant",
      subtitle: internship?.title ?? null,
      meta: "Pending review",
      linkTo: "/admin/2fas/applications",
    });
  }

  const upcomingWithCapacity = upcomingEventsRes.data ?? [];
  if (upcomingWithCapacity.length > 0) {
    const countMap = await fetchEventRegistrationCounts(upcomingWithCapacity.map((e) => e.id));
    for (const event of upcomingWithCapacity) {
      const capacity = event.capacity ?? 0;
      const registered = countMap.get(event.id) ?? 0;
      const spotsLeft = capacity - registered;
      const ratio = capacity > 0 ? registered / capacity : 0;
      if (spotsLeft <= 3 || ratio >= 0.75) {
        pendingReview.push({
          id: `lowcap-${event.id}`,
          type: "low_capacity_event",
          title: event.title,
          subtitle: `${registered} of ${capacity} seats filled`,
          meta: spotsLeft <= 0 ? "At capacity" : `${spotsLeft} spots left`,
          linkTo: "/admin/events",
        });
      }
    }
  }

  for (const row of latestRegsRes.data ?? []) {
    const event = row.events as { title: string } | null;
    const profile = row.profiles as { full_name: string | null } | null;
    pendingReview.push({
      id: `recent-reg-${row.id}`,
      type: "event_registration",
      title: profile?.full_name ?? "Registrant",
      subtitle: event?.title ?? null,
      meta: "Recently submitted",
      linkTo: "/admin/events",
    });
  }

  return {
    metrics,
    recentActivity,
    pendingReview: pendingReview.slice(0, 10),
  };
}
