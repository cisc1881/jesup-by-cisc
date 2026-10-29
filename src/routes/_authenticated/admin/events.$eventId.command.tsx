import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarDays, CheckCircle2, QrCode, Soup, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchEventById } from "@/lib/events";
import { fmtDateTime } from "@/lib/format";
import { productDb } from "@/lib/product-db";

export const Route = createFileRoute("/_authenticated/admin/events/$eventId/command")({
  component: EventCommandCenter,
});

function EventCommandCenter() {
  const { eventId } = Route.useParams();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["event-command-center", eventId],
    queryFn: async () => {
      const [event, registrations, checkedIn, linkedAccounts, meals, scans] = await Promise.all([
        fetchEventById(eventId),
        supabase
          .from("event_registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
          .neq("status", "cancelled"),
        supabase
          .from("event_registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
          .not("checked_in_at", "is", null)
          .neq("status", "cancelled"),
        supabase
          .from("event_registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
          .not("user_id", "is", null)
          .neq("status", "cancelled"),
        supabase
          .from("event_meal_redemptions")
          .select("id,event_meal_days!inner(event_id)", { count: "exact", head: true })
          .eq("event_meal_days.event_id", eventId),
        productDb
          .from("event_scan_events")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId),
      ]);
      if (!event) throw new Error("Event not found");
      for (const result of [registrations, checkedIn, linkedAccounts, meals])
        if (result.error) throw result.error;
      if (scans.error && scans.error.code !== "PGRST205" && scans.error.code !== "42P01")
        throw scans.error;
      return {
        event,
        registrations: registrations.count ?? 0,
        checkedIn: checkedIn.count ?? 0,
        linkedAccounts: linkedAccounts.count ?? 0,
        meals: meals.count ?? 0,
        scans: scans.error ? null : (scans.count ?? 0),
      };
    },
    refetchInterval: 60_000,
  });

  if (isLoading)
    return <div className="p-8 text-sm text-muted-foreground">Loading event operations…</div>;
  if (isError || !data)
    return (
      <div role="alert" className="p-8">
        <p>Event operations could not be loaded.</p>
        <button type="button" onClick={() => void refetch()} className="mt-3 underline">
          Try again
        </button>
      </div>
    );

  const { event, registrations, checkedIn, linkedAccounts, meals, scans } = data;
  const remaining = event.capacity == null ? null : Math.max(0, event.capacity - registrations);
  const checkInRate = registrations > 0 ? Math.round((checkedIn / registrations) * 100) : 0;
  const adoptionRate = registrations > 0 ? Math.round((linkedAccounts / registrations) * 100) : 0;
  const metrics = [
    { label: "Registrations", value: registrations, icon: Users },
    { label: "Checked in", value: checkedIn, icon: CheckCircle2 },
    { label: "Check-in rate", value: `${checkInRate}%`, icon: QrCode },
    { label: "Jesup account adoption", value: `${adoptionRate}%`, icon: Users },
    { label: "Meals redeemed", value: meals, icon: Soup },
    { label: "Published sessions", value: event.sessions.length, icon: CalendarDays },
    { label: "Capacity remaining", value: remaining ?? "No limit", icon: AlertTriangle },
    ...(scans === null ? [] : [{ label: "QR scans", value: scans, icon: QrCode }]),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Event Command Center
          </p>
          <h1 className="mt-2 text-3xl font-black">{event.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {fmtDateTime(event.startsAt)} · Updated about once a minute
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="min-h-11 rounded-xl border px-4 font-bold"
        >
          Refresh
        </button>
      </header>
      {remaining !== null && remaining <= 10 && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm font-bold"
        >
          <AlertTriangle className="h-5 w-5" />
          {remaining === 0 ? "Registration capacity reached" : `${remaining} spaces remain`}
        </div>
      )}
      <section aria-label="Live event metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]">
            <Icon className="h-5 w-5 text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-black">{value}</p>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-xl font-black">Operations</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link
            to="/admin/events/$eventId/attendance"
            params={{ eventId }}
            className="flex min-h-14 items-center rounded-xl border px-4 font-bold hover:bg-muted"
          >
            Check-in, attendance & badges
          </Link>
          <Link
            to="/admin/events/$eventId/scan"
            params={{ eventId }}
            className="flex min-h-14 items-center rounded-xl border px-4 font-bold hover:bg-muted"
          >
            QR scanner
          </Link>
          <Link
            to="/admin/events/$eventId/meals"
            params={{ eventId }}
            className="flex min-h-14 items-center rounded-xl border px-4 font-bold hover:bg-muted"
          >
            Meal service
          </Link>
          <Link
            to="/admin/events/$eventId/gallery"
            params={{ eventId }}
            className="flex min-h-14 items-center rounded-xl border px-4 font-bold hover:bg-muted"
          >
            Gallery moderation
          </Link>
          <Link
            to="/admin/events/$eventId/map"
            params={{ eventId }}
            className="flex min-h-14 items-center rounded-xl border px-4 font-bold hover:bg-muted"
          >
            Map & wayfinding
          </Link>
          <Link
            to="/admin/events/$eventId/wallet"
            params={{ eventId }}
            className="flex min-h-14 items-center rounded-xl border px-4 font-bold hover:bg-muted"
          >
            Wallet passes
          </Link>
          <Link
            to="/events/$id/hub"
            params={{ id: eventId }}
            className="flex min-h-14 items-center rounded-xl border px-4 font-bold hover:bg-muted"
          >
            Public event hub
          </Link>
        </div>
      </section>
    </div>
  );
}
