import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, ChevronRight, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fmtDateTime } from "@/lib/format";

type RegisteredEvent = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
};

export function MyJesupHomeSection() {
  const { user } = useAuth();
  const { data: registrations = [] } = useQuery({
    queryKey: ["home-my-registrations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("id, status, ticket_code, events(id,title,starts_at,location)")
        .eq("user_id", user!.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).filter((row) => !!row.events);
    },
  });

  if (!user || registrations.length === 0) return null;

  return (
    <section aria-labelledby="my-jesup-home-heading" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow institution-accent-text">Your schedule</p>
          <h2
            id="my-jesup-home-heading"
            className="text-2xl font-black tracking-tight text-foreground"
          >
            Registered for you
          </h2>
        </div>
        <Link to="/me" className="text-sm font-bold institution-accent-text">
          My JESUP
        </Link>
      </div>
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[var(--shadow-soft)]">
        {registrations.slice(0, 4).map((registration, index) => {
          const event = registration.events as unknown as RegisteredEvent;
          return (
            <Link
              key={registration.id}
              to="/events/$id"
              params={{ id: event.id }}
              className={`flex items-center gap-4 p-4 transition hover:bg-muted/50 ${index ? "border-t border-border/70" : ""}`}
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl institution-accent-bg">
                <CalendarCheck2 className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-foreground">{event.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {fmtDateTime(event.starts_at)}
                  {event.location ? ` · ${event.location}` : ""}
                </span>
                {registration.ticket_code && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold institution-accent-text">
                    <QrCode className="h-3.5 w-3.5" /> View event pass
                  </span>
                )}
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
