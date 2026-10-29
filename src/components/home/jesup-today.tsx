import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, MapPin, QrCode } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { eventPhase } from "@/lib/event-phase";
import { fmtDateTime } from "@/lib/format";
import type { HomeEvent } from "@/lib/home";

export function JesupToday({ events }: { events: HomeEvent[] }) {
  const { user } = useAuth();
  const { data: registrations = [] } = useQuery({
    queryKey: ["jesup-today-registrations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("event_id,ticket_code,status,events(id,title,starts_at,ends_at,location)")
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
    .sort(
      (a, b) =>
        Math.abs(Date.parse(a.events!.starts_at) - now) -
        Math.abs(Date.parse(b.events!.starts_at) - now),
    )[0];
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

  return (
    <section
      className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[var(--shadow-soft)]"
      aria-labelledby="jesup-today-heading"
    >
      <div className="grad-jesup px-5 py-7 text-white sm:px-8 sm:py-9">
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
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {phase === "during"
                  ? "Happening now"
                  : phase === "after"
                    ? "Continue learning"
                    : "Coming up"}
                {registration ? " · On your schedule" : ""}
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
            <div className="flex flex-wrap gap-3">
              <Link
                to="/events/$id/hub"
                params={{ id: current.id }}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground"
              >
                {phase === "after" ? "View event resources" : "Open event"}{" "}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {registration?.ticket_code && (
                <Link
                  to="/me"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-border px-5 font-bold"
                >
                  <QrCode className="h-4 w-4" /> My QR
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
              className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground"
            >
              Browse events <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
