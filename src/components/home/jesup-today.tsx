import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bell, CalendarDays, CheckCircle2, MapPin, QrCode } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { eventPhase } from "@/lib/event-phase";
import { fmtDateTime } from "@/lib/format";
import { fetchRegistrationSessionSelections } from "@/lib/events";
import type { HomeEvent } from "@/lib/home";
import { fetchNotifications } from "@/modules/notifications";

export function JesupToday({ events }: { events: HomeEvent[] }) {
  const { user } = useAuth();
  const { data: registrations = [] } = useQuery({
    queryKey: ["jesup-today-registrations", user?.id],
    enabled: !!user,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select(
          "id,event_id,ticket_code,status,checked_in_at,events(id,title,starts_at,ends_at,location)",
        )
        .eq("user_id", user!.id)
        .neq("status", "cancelled");
      if (error) throw error;
      return data ?? [];
    },
  });
  const now = Date.now();
  const registeredEvent = registrations
    .filter(
      (item) =>
        item.events &&
        Date.parse(item.events.ends_at ?? item.events.starts_at) > now - 30 * 24 * 60 * 60 * 1000,
    )
    .sort((a, b) => {
      const rank = (item: typeof a) => {
        const start = Date.parse(item.events!.starts_at);
        const end = Date.parse(item.events!.ends_at ?? item.events!.starts_at);
        return start <= now && end >= now ? 0 : start > now ? 1 : 2;
      };
      const rankDifference = rank(a) - rank(b);
      if (rankDifference) return rankDifference;
      return rank(a) === 2
        ? Date.parse(b.events!.ends_at ?? b.events!.starts_at) -
            Date.parse(a.events!.ends_at ?? a.events!.starts_at)
        : Date.parse(a.events!.starts_at) - Date.parse(b.events!.starts_at);
    })[0];
  const featuredEvent = [...events]
    .filter(
      (event) =>
        Date.parse(event.endsAt ?? event.startsAt) + (event.endsAt ? 0 : 24 * 60 * 60 * 1000) >=
        now,
    )
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
  const current = registeredEvent?.events
    ? {
        id: registeredEvent.events.id,
        title: registeredEvent.events.title,
        startsAt: registeredEvent.events.starts_at,
        endsAt: registeredEvent.events.ends_at,
        location: registeredEvent.events.location,
      }
    : featuredEvent
      ? { ...featuredEvent, endsAt: featuredEvent.endsAt ?? null }
      : null;
  const registration = current ? registrations.find((item) => item.event_id === current.id) : null;
  const phase = current ? eventPhase(current.startsAt, current.endsAt) : null;
  const { data: nextSession } = useQuery({
    queryKey: ["jesup-today-session", registration?.id, current?.id],
    enabled: !!registration?.id && registration.status !== "waiting_list" && !!current?.id,
    refetchInterval: 60_000,
    queryFn: async () => {
      const [selectedIds, sessionResult] = await Promise.all([
        fetchRegistrationSessionSelections(registration!.id),
        supabase
          .from("event_sessions")
          .select("id,title,starts_at,ends_at,location")
          .eq("event_id", current!.id)
          .order("starts_at", { ascending: true }),
      ]);
      if (sessionResult.error) throw sessionResult.error;
      const currentTime = Date.now();
      const sessions = (sessionResult.data ?? []).filter(
        (session) =>
          session.starts_at &&
          Date.parse(session.ends_at ?? session.starts_at) +
            (session.ends_at ? 0 : 60 * 60 * 1000) >=
            currentTime,
      );
      const session = sessions.find((item) => selectedIds.includes(item.id)) ?? sessions[0] ?? null;
      return {
        session,
        onAgenda: session ? selectedIds.includes(session.id) : false,
      };
    },
  });
  const { data: latestUpdates = [] } = useQuery({
    queryKey: ["jesup-today-updates", user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: () => fetchNotifications({ userId: user!.id, audience: "user", limit: 1 }),
  });

  return (
    <section
      className="jesup-today overflow-hidden border border-border/70 bg-card shadow-[var(--shadow-soft)]"
      aria-labelledby="jesup-today-heading"
    >
      <div className="jesup-today-banner grad-jesup relative px-5 py-7 text-white sm:px-8 sm:py-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
          Jesup · Digital Extension Wagon
        </p>
        <h2
          id="jesup-today-heading"
          className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"
        >
          Jesup Today
        </h2>
        <p className="mt-2 text-sm text-white/80">Knowledge in Motion. Impact Everywhere.</p>
      </div>
      <div className="space-y-5 p-5 sm:p-8">
        {current ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {phase === "during"
                    ? "Happening now"
                    : phase === "after"
                      ? "Continue learning"
                      : "Coming up"}
                  {registration?.status === "waiting_list"
                    ? " · Waitlisted"
                    : registration
                      ? " · On your schedule"
                      : ""}
                </p>
                <h3 className="mt-2 text-xl font-bold text-foreground sm:text-2xl">
                  {current.title}
                </h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {fmtDateTime(current.startsAt)}
                </p>
                {current.location && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {current.location}
                  </p>
                )}
              </div>
              {registration?.ticket_code && registration.status !== "waiting_list" && (
                <Link
                  to="/me/wallet"
                  className="jesup-today-credential inline-flex min-h-12 items-center gap-2 border border-border bg-background px-4 text-sm font-bold text-foreground shadow-sm"
                >
                  {registration.checked_in_at ? (
                    <CheckCircle2
                      className="size-4 text-emerald-700 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                  ) : (
                    <QrCode className="size-4" aria-hidden="true" />
                  )}
                  {registration.checked_in_at ? "Checked in · View pass" : "My event pass"}
                </Link>
              )}
            </div>
            {registration?.status !== "waiting_list" && nextSession?.session && (
              <div className="border-l-4 border-[var(--institution-accent)] bg-muted/50 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {nextSession.onAgenda ? "Next on your agenda" : "Next session at this event"}
                </p>
                <h4 className="mt-1 font-bold">{nextSession.session.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fmtDateTime(nextSession.session.starts_at)}
                  {nextSession.session.location ? ` · ${nextSession.session.location}` : ""}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/events/$id/hub"
                params={{ id: current.id }}
                className="jesup-today-action inline-flex min-h-12 items-center gap-2 bg-primary px-5 font-bold text-primary-foreground"
              >
                {phase === "after" ? "View event resources" : "Open event"}{" "}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {registration?.ticket_code && registration.status !== "waiting_list" && (
                <Link
                  to="/events/$id/hub"
                  params={{ id: current.id }}
                  className="jesup-today-action inline-flex min-h-12 items-center gap-2 border border-border px-5 font-bold"
                >
                  <CalendarDays className="h-4 w-4" /> My agenda
                </Link>
              )}
            </div>
          </>
        ) : (
          <div>
            <h3 className="text-xl font-bold">Explore what is happening across the network</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Find events, programs, and practical resources near you.
            </p>
            <Link
              to="/events"
              search={{ view: "explore" }}
              className="jesup-today-action mt-5 inline-flex min-h-12 items-center gap-2 bg-primary px-5 font-bold text-primary-foreground"
            >
              Browse events <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
        {latestUpdates[0] && (
          <Link
            to="/me/notifications"
            className="flex min-h-14 items-start gap-3 border-t border-border pt-5 text-sm hover:text-primary"
          >
            <Bell className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              <strong className="block">Latest update · {latestUpdates[0].title}</strong>
              {latestUpdates[0].body && (
                <span className="mt-1 block text-muted-foreground">{latestUpdates[0].body}</span>
              )}
            </span>
            <ArrowRight className="ml-auto size-4 shrink-0" aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  );
}
