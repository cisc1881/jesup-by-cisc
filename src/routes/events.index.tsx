import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/format";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/events/")({
  head: () => ({ meta: [{ title: "Events & Workshops · CISC Connect" }, { name: "description", content: "Upcoming workshops and events from CISC at Tuskegee University." }] }),
  component: EventsPage,
});

function EventsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("starts_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const now = Date.now();
  const upcoming = (data ?? []).filter((e) => new Date(e.starts_at).getTime() >= now);
  const past = (data ?? []).filter((e) => new Date(e.starts_at).getTime() < now);

  return (
    <PublicLayout>
      <PageHeader title="Events & Workshops" description="Learn, network, and grow with our community programs." />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        <h2 className="font-serif text-xl font-semibold text-primary">Upcoming</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcoming.length === 0 && !isLoading && <p className="text-muted-foreground">No upcoming events.</p>}
          {upcoming.map((e) => <EventCard key={e.id} e={e} />)}
        </div>
        {past.length > 0 && (
          <>
            <h2 className="mt-12 font-serif text-xl font-semibold text-primary">Past events</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-75">
              {past.slice(0, 6).map((e) => <EventCard key={e.id} e={e} />)}
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}

function EventCard({ e }: { e: any }) {
  return (
    <Link to="/events/$id" params={{ id: e.id }}>
      <Card className="h-full overflow-hidden transition hover:shadow-md">
        {e.image_url ? (
          <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${e.image_url})` }} />
        ) : (
          <div className="h-40 bg-gradient-to-br from-primary/80 to-primary" />
        )}
        <CardContent className="p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-accent">{fmtDateTime(e.starts_at)}</div>
          <h3 className="mt-2 font-serif text-lg font-semibold text-primary">{e.title}</h3>
          {e.location && <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{e.location}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}
