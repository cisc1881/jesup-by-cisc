import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fmtDate, fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/me")({ component: MePage });

function MePage() {
  const { user } = useAuth();
  const { data: regs } = useQuery({
    queryKey: ["my-regs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("event_registrations")
        .select("id, notes, created_at, events(id,title,starts_at,location)")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: apps } = useQuery({
    queryKey: ["my-apps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("internship_applications")
        .select("id,status,created_at,internships(id,title,department)")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: cos } = useQuery({
    queryKey: ["my-checkouts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("equipment_checkouts")
        .select("id,quantity,checkout_date,return_date,status,equipment(id,name)")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <PublicLayout>
      <PageHeader title="My Activity" description={user?.email ?? undefined} />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Tabs defaultValue="regs">
          <TabsList>
            <TabsTrigger value="regs">Event Registrations</TabsTrigger>
            <TabsTrigger value="apps">Internship Applications</TabsTrigger>
            <TabsTrigger value="cos">Equipment Checkouts</TabsTrigger>
          </TabsList>
          <TabsContent value="regs" className="mt-4 space-y-3">
            {(!regs || regs.length === 0) && <p className="text-muted-foreground">No registrations yet.</p>}
            {regs?.map((r: any) => (
              <Card key={r.id}><CardContent className="p-4">
                <Link to="/events/$id" params={{ id: r.events.id }} className="font-serif text-lg font-semibold text-primary hover:underline">{r.events.title}</Link>
                <p className="text-sm text-muted-foreground">{fmtDateTime(r.events.starts_at)} · {r.events.location}</p>
              </CardContent></Card>
            ))}
          </TabsContent>
          <TabsContent value="apps" className="mt-4 space-y-3">
            {(!apps || apps.length === 0) && <p className="text-muted-foreground">No applications yet.</p>}
            {apps?.map((a: any) => (
              <Card key={a.id}><CardContent className="p-4 flex items-center justify-between gap-2">
                <div>
                  <div className="font-serif text-lg font-semibold text-primary">{a.internships.title}</div>
                  <p className="text-sm text-muted-foreground">{a.internships.department} · {fmtDate(a.created_at)}</p>
                </div>
                <Badge>{a.status}</Badge>
              </CardContent></Card>
            ))}
          </TabsContent>
          <TabsContent value="cos" className="mt-4 space-y-3">
            {(!cos || cos.length === 0) && <p className="text-muted-foreground">No checkouts yet.</p>}
            {cos?.map((c: any) => (
              <Card key={c.id}><CardContent className="p-4 flex items-center justify-between gap-2">
                <div>
                  <div className="font-serif text-lg font-semibold text-primary">{c.equipment.name}</div>
                  <p className="text-sm text-muted-foreground">Qty {c.quantity} · {fmtDate(c.checkout_date)} → {fmtDate(c.return_date)}</p>
                </div>
                <Badge>{c.status}</Badge>
              </CardContent></Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </PublicLayout>
  );
}
