import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronRight, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useInstitutionTheme } from "@/components/institution-theme-provider";

type TodaySession = {
  id: string;
  title: string;
  starts_at: string | null;
  location: string | null;
  event_id: string;
  eventTitle: string;
  institutionIds: string[];
  networkWide: boolean;
};

export function EventDiscoveryHomeSection() {
  const navigate = useNavigate();
  const { institutionId } = useInstitutionTheme();
  const [query, setQuery] = useState("");
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { data: sessions = [] } = useQuery({
    queryKey: ["home-today-sessions", start, institutionId],
    queryFn: async (): Promise<TodaySession[]> => {
      const { data, error } = await supabase
        .from("event_sessions")
        .select("id,title,starts_at,location,event_id,events!inner(title,metadata,status,is_active)")
        .eq("events.status", "published")
        .eq("events.is_active", true)
        .gte("starts_at", start)
        .lt("starts_at", end)
        .order("starts_at")
        .limit(12);
      if (error) throw error;
      return (data ?? []).map((row) => {
        const event = row.events as unknown as {
          title: string;
          metadata: Record<string, unknown> | null;
        };
        return {
          id: row.id,
          title: row.title,
          starts_at: row.starts_at,
          location: row.location,
          event_id: row.event_id,
          eventTitle: event?.title ?? "JESUP event",
          institutionIds: Array.isArray(event?.metadata?.institution_ids) ? event.metadata.institution_ids.filter((id): id is string => typeof id === "string") : [],
          networkWide: event?.metadata?.network_wide !== false,
        };
      });
    },
  });

  const relevantSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          !institutionId || session.networkWide || session.institutionIds.includes(institutionId),
      ),
    [institutionId, sessions],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    void navigate({ to: "/search", search: { q } });
  }

  return (
    <section
      aria-labelledby="event-discovery-home-heading"
      className="border border-border bg-card"
    >
      <div className="institution-primary-surface border-b px-4 py-5 sm:px-6">
        <p className="text-eyebrow institution-accent-text">Event network</p>
        <h2 id="event-discovery-home-heading" className="mt-1 text-2xl font-black tracking-tight">
          Your event experience
        </h2>
      </div>

      <div className="grid grid-cols-2 border-b">
        <Link
          to="/events"
          search={{ view: "mine" }}
          className="flex min-h-14 items-center justify-center border-r border-b-4 border-b-transparent px-4 text-sm font-black hover:border-b-[var(--institution-accent)]"
        >
          My Events
        </Link>
        <Link
          to="/events"
          search={{ view: "explore" }}
          className="flex min-h-14 items-center justify-center border-b-4 border-b-[var(--institution-accent)] px-4 text-sm font-black institution-accent-text"
        >
          Explore Events
        </Link>
      </div>

      <form onSubmit={submit} className="flex items-stretch border-b p-3 sm:p-4">
        <label className="flex min-h-12 min-w-0 flex-1 items-center gap-3 border bg-background px-4">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="sr-only">Search sessions</span>
          <input
            id="home-session-search"
            name="session_search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="Search sessions, speakers, rooms, or topics"
          />
        </label>
        <button type="submit" className="min-h-12 px-5 text-sm font-black institution-accent-bg">
          Search
        </button>
      </form>

      <div>
        <div className="flex items-center justify-between border-b px-4 py-4 sm:px-6">
          <h3 className="font-black">Today&apos;s sessions</h3>
          <CalendarDays className="h-5 w-5 institution-accent-text" />
        </div>
        {relevantSessions.length > 0 ? (
          <div className="divide-y">
            {relevantSessions.slice(0, 5).map((session) => (
              <Link
                key={session.id}
                to="/events/$id/hub"
                params={{ id: session.event_id }}
                className="grid grid-cols-[72px_minmax(0,1fr)_24px] items-center gap-3 px-4 py-4 hover:bg-muted/50 sm:px-6"
              >
                <span className="text-sm font-black institution-accent-text">
                  {session.starts_at
                    ? new Date(session.starts_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "TBA"}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold">{session.title}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {session.eventTitle}
                    {session.location ? ` · ${session.location}` : ""}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-4 py-6 text-sm text-muted-foreground sm:px-6">
            No sessions are scheduled for today. Explore upcoming conferences, workshops, meetings,
            and seminars.
          </p>
        )}
      </div>
    </section>
  );
}
