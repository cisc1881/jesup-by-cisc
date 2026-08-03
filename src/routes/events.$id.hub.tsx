import { FormEvent, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Accessibility,
  ArrowLeft,
  BarChart3,
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  ContactRound,
  FileText,
  Flag,
  Gamepad2,
  Handshake,
  HeartHandshake,
  Heart,
  Map,
  MapPin,
  MapPinned,
  MessageCircle,
  NotebookPen,
  Paperclip,
  Mic2,
  Network,
  QrCode,
  Search,
  Share2,
  Soup,
  Sparkles,
  Star,
  Store,
  Trophy,
  UserRoundCheck,
  Users,
  Vote,
} from "lucide-react";
import { EventAgendaNotice, EventChatRoom } from "@/components/events";
import { PublicLayout } from "@/components/public-layout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchEventById,
  fetchRegistrationSessionSelections,
  fetchUserEventRegistration,
  saveRegistrationSessionSelections,
  type EventAttachment,
  type EventSession,
} from "@/lib/events";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/events/$id/hub")({
  loader: async ({ params }) => ({ event: await fetchEventById(params.id) }),
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.event?.title ?? "Event"} Hub · JESUP` }],
  }),
  component: EventHubPage,
});

type HubTab = "home" | "agenda" | "attendees" | "community" | "more";

type EventAttendee = {
  id: string;
  user_id: string | null;
  status: string;
  checked_in_at: string | null;
  full_name: string;
  affiliation: string | null;
  school_name: string | null;
  major_or_interest: string | null;
};

const additionalTools = [
  ["Announcements & reminders", BellRing],
  ["QR check-in & badges", QrCode],
  ["Session attendance", ClipboardCheck],
  ["Meal tickets", Soup],
  ["Floor map & parking", MapPinned],
  ["Speakers", Mic2],
  ["Documents & handouts", FileText],
  ["Surveys & live polls", Vote],
  ["Session Q&A", CircleHelp],
  ["Photos", Camera],
  ["Exhibitors & sponsors", Store],
  ["Lead capture", BriefcaseBusiness],
  ["Career fair", Handshake],
  ["Networking meetings", Network],
  ["Passport & leaderboard", Trophy],
  ["Accessibility requests", Accessibility],
] as const;

function EventHubPage() {
  const { id } = Route.useParams();
  const { event } = Route.useLoaderData();
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState<HubTab>("home");
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [savedSessions, setSavedSessions] = useState<string[]>([]);
  const [agendaMode, setAgendaMode] = useState<"full" | "mine">("full");
  const [selectedSession, setSelectedSession] = useState<EventSession | null>(null);
  const storageKey = `jesup-event-agenda:${id}:${user?.id ?? "guest"}`;

  useEffect(() => {
    try {
      setSavedSessions(JSON.parse(window.localStorage.getItem(storageKey) ?? "[]"));
    } catch {
      setSavedSessions([]);
    }
  }, [storageKey]);

  const { data: registration } = useQuery({
    queryKey: ["event-hub-registration", id, user?.id],
    enabled: !!user,
    queryFn: () => fetchUserEventRegistration(id, user!.id),
  });
  const registered = !!registration || isAdmin;
  const { data: registeredSessionIds = [] } = useQuery({
    queryKey: ["registration-session-plan", registration?.id],
    enabled: !!registration?.id,
    queryFn: () => fetchRegistrationSessionSelections(registration!.id),
  });

  useEffect(() => {
    if (registeredSessionIds.length === 0) return;
    setSavedSessions((current) => {
      const next = [...new Set([...current, ...registeredSessionIds])];
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [registeredSessionIds, storageKey]);
  const { data: attendees = [], isLoading: attendeesLoading } = useQuery({
    queryKey: ["event-attendee-directory", id],
    enabled: registered,
    queryFn: async (): Promise<EventAttendee[]> => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select(
          "id, user_id, status, checked_in_at, attendee_name, profiles(full_name, affiliation, school_name, major_or_interest)",
        )
        .eq("event_id", id)
        .neq("status", "cancelled");
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        status: row.status,
        checked_in_at: row.checked_in_at,
        full_name: row.profiles?.full_name || row.attendee_name || "JESUP attendee",
        affiliation: row.profiles?.affiliation ?? null,
        school_name: row.profiles?.school_name ?? null,
        major_or_interest: row.profiles?.major_or_interest ?? null,
      }));
    },
  });

  const visibleSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (
      event?.sessions.filter((session: EventSession) => {
        if (agendaMode === "mine" && !savedSessions.includes(session.id)) return false;
        if (
          dateFilter !== "all" &&
          (!session.startsAt ||
            new Date(session.startsAt).toISOString().slice(0, 10) !== dateFilter)
        )
          return false;
        if (locationFilter !== "all" && session.location !== locationFilter) return false;
        return (
          !query ||
          [session.title, session.location, session.description].some((value) =>
            value?.toLowerCase().includes(query),
          )
        );
      }) ?? []
    );
  }, [agendaMode, dateFilter, event?.sessions, locationFilter, savedSessions, search]);

  const sessionDates = useMemo(
    () => [
      ...new Set(
        (event?.sessions ?? [])
          .map((session: EventSession) =>
            session.startsAt ? new Date(session.startsAt).toISOString().slice(0, 10) : null,
          )
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [event?.sessions],
  );
  const sessionLocations = useMemo(
    () =>
      [
        ...new Set(
          (event?.sessions ?? [])
            .map((session: EventSession) => session.location)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
    [event?.sessions],
  );

  const visibleAttendees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return attendees.filter(
      (attendee) =>
        !query ||
        [
          attendee.full_name,
          attendee.affiliation,
          attendee.school_name,
          attendee.major_or_interest,
        ].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [attendees, search]);

  function toggleSession(sessionId: string) {
    const next = savedSessions.includes(sessionId)
      ? savedSessions.filter((item) => item !== sessionId)
      : [...savedSessions, sessionId];
    setSavedSessions(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    if (registration?.id) {
      void saveRegistrationSessionSelections(registration.id, next);
    }
  }

  function submitSessionSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchDraft.trim());
  }

  if (!event) return null;

  const primaryTools = [
    { label: "My registration", icon: CheckCircle2, tab: "home" as HubTab },
    { label: "My event QR", icon: QrCode, href: `/events/${id}#event-registration` },
    { label: "My agenda", icon: CalendarDays, tab: "agenda" as HubTab },
    { label: "Attendees", icon: Users, tab: "attendees" as HubTab },
    { label: "Community", icon: MessageCircle, tab: "community" as HubTab },
    { label: "Ask JESUP", icon: Sparkles, href: "/ask" },
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background pb-bottom-nav">
        <header className="grad-jesup text-white">
          <div className="mx-auto max-w-5xl px-4 pb-5 pt-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <Link
                to="/events/$id"
                params={{ id }}
                className="inline-flex min-h-11 items-center gap-2 font-bold text-white/90"
              >
                <ArrowLeft className="h-5 w-5" /> Event
              </Link>
              <Link
                to="/me/messages"
                className="relative grid h-11 w-11 place-items-center border border-white/60"
                aria-label="Messages"
              >
                <MessageCircle className="h-6 w-6" />
              </Link>
            </div>
            <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.18em] text-white/75">
              JESUP Event Hub
            </p>
            <h1 className="mt-1 text-2xl font-black leading-tight sm:text-3xl">{event.title}</h1>
            <p className="mt-2 text-sm text-white/80">
              {fmtDateTime(event.startsAt)}
              {event.location ? ` · ${event.location}` : ""}
            </p>
          </div>
        </header>

        <nav
          className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur"
          aria-label="Event Hub sections"
        >
          <div className="mx-auto grid max-w-5xl grid-cols-5">
            {(["home", "agenda", "attendees", "community", "more"] as HubTab[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setTab(item);
                  setSearch("");
                  setSearchDraft("");
                }}
                className={cn(
                  "min-h-14 border-b-4 px-1 text-xs font-bold capitalize sm:text-sm",
                  tab === item
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </nav>

        <main className="mx-auto max-w-5xl">
          {tab === "home" && (
            <div>
              {!registered && (
                <Link
                  to="/events/$id"
                  params={{ id }}
                  hash="event-registration"
                  className="block border-b-[6px] border-muted bg-primary/5 px-4 py-5 font-bold text-primary sm:px-6"
                >
                  Register to unlock attendee networking, personal agenda, community, QR admission,
                  and meal tickets.
                </Link>
              )}
              <section aria-labelledby="event-essentials-heading">
                <h2
                  id="event-essentials-heading"
                  className="border-b px-4 py-4 text-lg font-black sm:px-6"
                >
                  Event essentials
                </h2>
                <div className="divide-y">
                  {primaryTools.map((tool) => {
                    const Icon = tool.icon;
                    const content = (
                      <>
                        <span className="grid h-11 w-11 place-items-center bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="flex-1 font-bold">{tool.label}</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </>
                    );
                    return tool.href ? (
                      <a
                        key={tool.label}
                        href={tool.href}
                        className="flex min-h-16 items-center gap-4 px-4 py-3 hover:bg-muted/50 sm:px-6"
                      >
                        {content}
                      </a>
                    ) : (
                      <button
                        key={tool.label}
                        type="button"
                        onClick={() => setTab(tool.tab!)}
                        className="flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left hover:bg-muted/50 sm:px-6"
                      >
                        {content}
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="border-t-[6px] border-muted">
                <h2 className="border-b px-4 py-4 text-lg font-black sm:px-6">
                  Featured resources
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3">
                  {additionalTools.slice(0, 9).map(([label, Icon]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setTab("more")}
                      className="min-h-28 border-b border-r p-4 text-left hover:bg-muted/50"
                    >
                      <Icon className="h-6 w-6 text-primary" />
                      <span className="mt-3 block text-sm font-bold">{label}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {tab === "agenda" && (
            <section>
              {selectedSession ? (
                <div>
                  <div className="grad-jesup text-white">
                    <div className="flex min-h-16 items-center justify-between px-4 sm:px-6">
                      <button
                        type="button"
                        onClick={() => setSelectedSession(null)}
                        className="inline-flex min-h-11 items-center gap-2 font-bold"
                      >
                        <ArrowLeft className="h-5 w-5" /> Agenda
                      </button>
                      <span className="font-black">Session details</span>
                      <button
                        type="button"
                        className="grid h-11 w-11 place-items-center"
                        aria-label="Share session"
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="border-b px-5 py-6 text-center sm:px-8 sm:py-8">
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
                      Displaying time in the event time zone
                    </p>
                    <h2 className="mx-auto mt-5 max-w-3xl text-2xl font-black tracking-tight sm:text-3xl">
                      {selectedSession.title}
                    </h2>
                    {selectedSession.startsAt && (
                      <p className="mt-4 font-semibold text-muted-foreground">
                        {fmtDateTime(selectedSession.startsAt)}
                        {selectedSession.endsAt
                          ? ` – ${new Date(selectedSession.endsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" })}`
                          : ""}
                      </p>
                    )}
                    {selectedSession.location && (
                      <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-primary">
                        <MapPin className="h-4 w-4" /> {selectedSession.location}
                      </p>
                    )}
                    {selectedSession.description && (
                      <p className="mx-auto mt-5 max-w-2xl text-left text-sm leading-7 text-muted-foreground sm:text-center">
                        {selectedSession.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 border-b p-4 sm:p-6">
                    <button
                      type="button"
                      onClick={() => toggleSession(selectedSession.id)}
                      className="flex min-h-14 w-full items-center justify-center gap-3 bg-primary px-5 font-extrabold text-primary-foreground"
                    >
                      <Star
                        className={cn(
                          "h-5 w-5",
                          savedSessions.includes(selectedSession.id) && "fill-current",
                        )}
                      />
                      {savedSessions.includes(selectedSession.id)
                        ? "Remove from My Agenda"
                        : "Add to My Agenda"}
                    </button>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTab("community")}
                        className="flex min-h-12 items-center justify-center gap-2 border border-primary px-2 text-sm font-bold text-primary"
                      >
                        <Vote className="h-4 w-4" /> Polls
                      </button>
                      <button
                        type="button"
                        className="flex min-h-12 items-center justify-center gap-2 border border-primary px-2 text-sm font-bold text-primary"
                      >
                        <Heart className="h-4 w-4" /> Like
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab("community")}
                        className="flex min-h-12 items-center justify-center gap-2 border border-primary px-2 text-sm font-bold text-primary"
                      >
                        <MessageCircle className="h-4 w-4" /> Chat
                      </button>
                    </div>
                  </div>

                  <section className="border-b-[6px] border-muted">
                    <h3 className="border-b bg-muted/70 px-5 py-3 text-sm font-black uppercase tracking-wide sm:px-6">
                      Personal notes
                    </h3>
                    <div className="grid grid-cols-2 gap-3 p-4 sm:p-6">
                      <button
                        type="button"
                        className="flex min-h-14 items-center justify-center gap-2 bg-muted px-3 font-bold"
                      >
                        <Camera className="h-5 w-5" /> Add a photo
                      </button>
                      <button
                        type="button"
                        className="flex min-h-14 items-center justify-center gap-2 bg-primary px-3 font-bold text-primary-foreground"
                      >
                        <NotebookPen className="h-5 w-5" /> Add a note
                      </button>
                    </div>
                  </section>

                  <section>
                    <h3 className="border-b bg-muted/70 px-5 py-3 text-sm font-black uppercase tracking-wide sm:px-6">
                      Handouts ({event.publications.length})
                    </h3>
                    {event.publications.length > 0 ? (
                      <div className="divide-y">
                        {event.publications.map((document) => (
                          <Link
                            key={document.id}
                            to={document.href}
                            {...(document.hrefParams ? { params: document.hrefParams } : {})}
                            className="flex min-h-16 items-center gap-3 px-5 py-3 hover:bg-muted/50 sm:px-6"
                          >
                            <Paperclip className="h-5 w-5 text-primary" />
                            <span className="flex-1 font-bold">{document.title}</span>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="px-5 py-8 text-sm leading-6 text-muted-foreground sm:px-6">
                        No session handouts have been uploaded yet. Documents added by the organizer
                        will appear here.
                      </p>
                    )}
                  </section>
                </div>
              ) : (
                <>
                  <div className="grad-jesup p-4 text-white sm:p-6">
                    <form onSubmit={submitSessionSearch} className="flex items-stretch gap-2">
                      <label className="flex min-h-12 min-w-0 flex-1 items-center gap-3 bg-white px-4 text-foreground">
                        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="sr-only">Search event sessions</span>
                        <input
                          id={`event-${id}-session-search`}
                          name="session_search"
                          value={searchDraft}
                          onChange={(e) => setSearchDraft(e.target.value)}
                          className="min-w-0 flex-1 bg-transparent outline-none"
                          placeholder="Search sessions, rooms, speakers…"
                        />
                      </label>
                      <button
                        type="submit"
                        className="min-h-12 bg-slate-900 px-5 text-sm font-extrabold text-white hover:bg-slate-800"
                      >
                        Search
                      </button>
                    </form>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <label>
                        <span className="sr-only">Filter sessions by date</span>
                        <select
                          value={dateFilter}
                          onChange={(event) => setDateFilter(event.target.value)}
                          className="min-h-11 w-full border border-white/60 bg-white px-3 text-sm font-bold text-slate-900"
                        >
                          <option value="all">All dates</option>
                          {sessionDates.map((date) => (
                            <option key={date} value={date}>
                              {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="sr-only">Filter sessions by room</span>
                        <select
                          value={locationFilter}
                          onChange={(event) => setLocationFilter(event.target.value)}
                          className="min-h-11 w-full border border-white/60 bg-white px-3 text-sm font-bold text-slate-900"
                        >
                          <option value="all">All rooms and locations</option>
                          {sessionLocations.map((location) => (
                            <option key={location} value={location}>
                              {location}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    {(search || dateFilter !== "all" || locationFilter !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setSearchDraft("");
                          setDateFilter("all");
                          setLocationFilter("all");
                        }}
                        className="mt-3 text-sm font-bold text-white underline underline-offset-4"
                      >
                        Clear search and filters
                      </button>
                    )}
                    <div className="mt-3 grid grid-cols-2 border border-white/70">
                      {(["full", "mine"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setAgendaMode(mode)}
                          className={cn(
                            "min-h-11 font-bold",
                            agendaMode === mode ? "bg-white text-primary" : "text-white",
                          )}
                        >
                          {mode === "full" ? "Full agenda" : `My agenda (${savedSessions.length})`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="px-4 pt-4 sm:px-6">
                    <EventAgendaNotice metadata={event.metadata} />
                  </div>
                  <div className="divide-y">
                    {visibleSessions.map((session: EventSession) => (
                      <article
                        key={session.id}
                        className="grid grid-cols-[86px_minmax(0,1fr)_44px] gap-3 px-4 py-5 sm:px-6"
                      >
                        <div className="text-sm font-bold text-primary">
                          {session.startsAt
                            ? fmtDateTime(session.startsAt).split(",").slice(-1)
                            : "TBA"}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedSession(session)}
                          className="min-w-0 text-left"
                        >
                          <h3 className="font-black">{session.title}</h3>
                          {session.location && (
                            <p className="mt-1 text-sm text-muted-foreground">{session.location}</p>
                          )}
                          {session.description && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {session.description}
                            </p>
                          )}
                        </button>
                        <button
                          onClick={() => toggleSession(session.id)}
                          className="grid h-11 w-11 place-items-center"
                          aria-label={
                            savedSessions.includes(session.id)
                              ? "Remove from my agenda"
                              : "Add to my agenda"
                          }
                        >
                          <Star
                            className={cn(
                              "h-6 w-6",
                              savedSessions.includes(session.id) && "fill-primary text-primary",
                            )}
                          />
                        </button>
                      </article>
                    ))}
                    {visibleSessions.length === 0 && (
                      <p className="px-6 py-16 text-center text-muted-foreground">
                        No sessions match this view.
                      </p>
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          {tab === "attendees" && (
            <section>
              <div className="grad-jesup p-4 sm:p-6">
                <label className="flex min-h-12 items-center gap-3 bg-white px-4">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="min-w-0 flex-1 outline-none"
                    placeholder="Search attendees, schools, interests…"
                  />
                </label>
              </div>
              {!registered ? (
                <p className="px-6 py-16 text-center text-muted-foreground">
                  Register for this event to access its private attendee directory.
                </p>
              ) : attendeesLoading ? (
                <p className="px-6 py-10">Loading attendees…</p>
              ) : (
                <div className="divide-y">
                  {visibleAttendees.map((attendee) => (
                    <article
                      key={attendee.user_id}
                      className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-6"
                    >
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--gradient-jesup)] text-lg font-black text-white">
                        {attendee.full_name.slice(0, 1)}
                      </span>
                      <div>
                        <h3 className="font-bold">{attendee.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {attendee.affiliation ?? attendee.school_name ?? "Event attendee"}
                        </p>
                        {attendee.major_or_interest && (
                          <p className="text-xs text-muted-foreground">
                            {attendee.major_or_interest}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setTab("community")}
                        className="text-sm font-bold text-primary"
                      >
                        Say hi
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "community" && (
            <section className="p-4 sm:p-6">
              <div className="mb-5 border-b pb-5">
                <h2 className="text-xl font-black">Community</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Organizer announcements, attendee questions, meet-ups, ride sharing, and event
                  conversation.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Introduce yourself",
                    "Ask organizers",
                    "Plan a meet-up",
                    "Ride share",
                    "Exhibitor showcase",
                  ].map((topic) => (
                    <span
                      key={topic}
                      className="border border-primary px-3 py-2 text-xs font-bold text-primary"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <EventChatRoom eventId={id} registered={registered} />
            </section>
          )}

          {tab === "more" && (
            <section>
              <h2 className="border-b px-4 py-4 text-xl font-black sm:px-6">All event tools</h2>
              <div className="divide-y">
                {additionalTools.map(([label, Icon]) => (
                  <div key={label} className="flex min-h-16 items-center gap-4 px-4 py-3 sm:px-6">
                    <span className="grid h-10 w-10 place-items-center bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1 font-bold">{label}</span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {registered ? "Available" : "Registration required"}
                    </span>
                  </div>
                ))}
              </div>
              {isAdmin && (
                <div className="border-t-[6px] border-muted">
                  <h2 className="border-b px-4 py-4 text-xl font-black sm:px-6">Organizer tools</h2>
                  {[
                    [
                      "Attendance, badges & scanners",
                      `/admin/events/${id}/attendance`,
                      UserRoundCheck,
                    ],
                    ["Meal ticket setup", `/admin/events/${id}/meals`, Soup],
                    ["Event reports & sponsor ROI", "/admin/reports/events", BarChart3],
                    ["Gallery moderation", `/admin/events/${id}/gallery`, Flag],
                  ].map(([label, href, Icon]) => (
                    <a
                      key={String(label)}
                      href={String(href)}
                      className="flex min-h-16 items-center gap-4 border-b px-4 py-3 hover:bg-muted/50 sm:px-6"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="flex-1 font-bold">{String(label)}</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </PublicLayout>
  );
}
