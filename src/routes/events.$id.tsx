import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fmtDateTime } from "@/lib/format";
import { MapPin, Calendar, Users, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/events/$id")({ component: EventDetail });

function EventDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: regs } = useQuery({
    queryKey: ["event-reg", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("event_registrations").select("id").eq("event_id", id).eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: count } = useQuery({
    queryKey: ["event-count", id],
    queryFn: async () => {
      const { count } = await supabase.from("event_registrations").select("*", { count: "exact", head: true }).eq("event_id", id);
      return count ?? 0;
    },
  });

  async function register() {
    if (!user) return navigate({ to: "/auth", search: { next: `/events/${id}` } });
    setBusy(true);
    const { error } = await supabase.from("event_registrations").insert({ event_id: id, user_id: user.id, notes: notes || null });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("You're registered!");
    qc.invalidateQueries({ queryKey: ["event-reg", id] });
    qc.invalidateQueries({ queryKey: ["event-count", id] });
  }

  if (isLoading) return <PublicLayout><div className="mx-auto max-w-3xl p-8">Loading…</div></PublicLayout>;
  if (!event) return <PublicLayout><div className="mx-auto max-w-3xl p-8">Event not found.</div></PublicLayout>;

  const full = event.capacity != null && (count ?? 0) >= event.capacity;

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/events"><ArrowLeft className="mr-1 h-4 w-4" />All events</Link></Button>
        {event.image_url && (
          <div className="mb-6 h-64 w-full rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${event.image_url})` }} />
        )}
        <span className="gold-bar mb-3" />
        <h1 className="font-serif text-3xl font-bold text-primary sm:text-4xl">{event.title}</h1>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-accent" />{fmtDateTime(event.starts_at)}{event.ends_at ? ` – ${fmtDateTime(event.ends_at)}` : ""}</span>
          {event.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-accent" />{event.location}</span>}
          {event.capacity != null && <span className="flex items-center gap-1"><Users className="h-4 w-4 text-accent" />{count ?? 0}/{event.capacity}</span>}
        </div>
        {event.description && <p className="mt-6 whitespace-pre-wrap leading-relaxed text-foreground/85">{event.description}</p>}

        <Card className="mt-8">
          <CardContent className="p-6">
            <h2 className="font-serif text-xl font-semibold text-primary">Register</h2>
            {!event.registration_open ? (
              <p className="mt-2 text-muted-foreground">Registration is closed for this event.</p>
            ) : regs ? (
              <p className="mt-2 text-green-700">✓ You're registered for this event.</p>
            ) : full ? (
              <p className="mt-2 text-muted-foreground">This event is at capacity.</p>
            ) : (
              <div className="mt-4 space-y-3">
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dietary restrictions, accessibility needs, etc." />
                </div>
                <Button onClick={register} disabled={busy} className="bg-primary hover:bg-primary/90">
                  {busy ? "Registering…" : user ? "Register" : "Sign in to register"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
