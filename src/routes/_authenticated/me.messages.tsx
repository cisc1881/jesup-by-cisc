import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight, Mail, MessageCircle, SquarePen } from "lucide-react";
import { PublicLayout } from "@/components/public-layout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/format";
import { fetchNotifications, markNotificationRead } from "@/modules/notifications";

export const Route = createFileRoute("/_authenticated/me/messages")({
  component: MessagesPage,
  head: () => ({ meta: [{ title: "Messages · JESUP" }] }),
});

function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["my-message-inbox", user?.id];
  const { data: updates = [], isLoading } = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: () => fetchNotifications({ userId: user!.id, audience: "user", limit: 100 }),
  });
  const { data: registrations = [] } = useQuery({
    queryKey: ["message-event-conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("id, events(id,title,starts_at,image_url)")
        .eq("user_id", user!.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).filter((row) => !!row.events);
    },
  });
  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id, user!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ["header-message-count", user?.id] });
    },
  });
  const unreadCount = updates.filter((item) => !item.isRead).length;

  return (
    <PublicLayout>
      <header className="grad-jesup text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-white/80">My JESUP</p>
            <h1 className="text-2xl font-black">Messages ({unreadCount})</h1>
          </div>
          <Link
            to="/events"
            className="grid h-11 w-11 place-items-center border border-white/70 text-white transition hover:bg-white/15"
            aria-label="Start an event conversation"
          >
            <SquarePen className="h-6 w-6" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl pb-bottom-nav">
        {registrations.length > 0 && (
          <section
            aria-labelledby="event-conversations-heading"
            className="border-b-[6px] border-muted"
          >
            <h2
              id="event-conversations-heading"
              className="border-b border-border px-4 py-3 text-sm font-extrabold sm:px-6"
            >
              Event conversations
            </h2>
            {registrations.map((registration) => {
              const event = registration.events as unknown as {
                id: string;
                title: string;
                starts_at: string;
                image_url: string | null;
              };
              return (
                <Link
                  key={registration.id}
                  to="/events/$id"
                  params={{ id: event.id }}
                  hash="chat"
                  className="grid grid-cols-[64px_minmax(0,1fr)_24px] items-center gap-4 border-b border-border px-4 py-4 hover:bg-muted/50 sm:px-6"
                >
                  <span className="grid h-14 w-14 place-items-center overflow-hidden bg-muted">
                    {event.image_url ? (
                      <img src={event.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <MessageCircle className="h-7 w-7 text-primary" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-extrabold text-foreground">
                      {event.title}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Attendee chat · {fmtDateTime(event.starts_at)}
                    </span>
                  </span>
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                </Link>
              );
            })}
          </section>
        )}

        <section aria-labelledby="message-updates-heading">
          <h2
            id="message-updates-heading"
            className="border-b border-border px-4 py-3 text-sm font-extrabold sm:px-6"
          >
            Updates
          </h2>
          {isLoading && (
            <p className="px-4 py-10 text-muted-foreground sm:px-6">Loading messages…</p>
          )}
          {!isLoading && updates.length === 0 && registrations.length === 0 && (
            <div className="grid place-items-center gap-3 px-6 py-16 text-center">
              <Mail className="h-10 w-10 text-primary" />
              <p className="font-bold text-foreground">No messages yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Registration updates and conversations for your events will appear here.
              </p>
            </div>
          )}
          <div className="divide-y divide-border">
            {updates.map((update) => (
              <button
                key={update.id}
                type="button"
                onClick={() => !update.isRead && markOne.mutate(update.id)}
                className="grid w-full grid-cols-[64px_minmax(0,1fr)] gap-4 px-4 py-4 text-left transition hover:bg-muted/50 sm:px-6"
              >
                <span className="relative grid h-14 w-14 place-items-center bg-[var(--gradient-jesup)] text-white">
                  <CalendarDays className="h-7 w-7" />
                  {!update.isRead && (
                    <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-destructive ring-2 ring-background" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="flex items-start justify-between gap-3">
                    <span className="truncate font-extrabold text-foreground">{update.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {fmtDateTime(update.createdAt)}
                    </span>
                  </span>
                  {update.body && (
                    <span className="mt-1 line-clamp-2 block text-sm leading-snug text-muted-foreground">
                      {update.body}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
