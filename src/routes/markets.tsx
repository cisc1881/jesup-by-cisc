import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Clock, Calendar as CalIcon, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/markets")({
  head: () => ({ meta: [{ title: "Farmers Markets · CISC Connect" }, { name: "description", content: "Directory of farmers markets served by Tuskegee University's CISC." }] }),
  component: MarketsPage,
});

function MarketsPage() {
  const [q, setQ] = useState("");
  const { data: markets, isLoading } = useQuery({
    queryKey: ["markets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("markets").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
  const filtered = (markets ?? []).filter((m) =>
    !q || [m.name, m.city, m.state, m.address].filter(Boolean).some((s) => s!.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <PublicLayout>
      <PageHeader title="Farmers Market Directory" description="Locally grown, community rooted. Find a market near you." />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap gap-3">
          <Input placeholder="Search markets…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            {isLoading && <p className="text-muted-foreground">Loading…</p>}
            {!isLoading && filtered.length === 0 && (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No markets found.</CardContent></Card>
            )}
            {filtered.map((m) => (
              <Card key={m.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-serif text-lg font-bold text-primary">{m.name}</h3>
                      {m.description && <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>}
                      <div className="mt-3 space-y-1 text-sm">
                        {m.address && <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span>{[m.address, m.city, m.state].filter(Boolean).join(", ")}</span></div>}
                        {m.hours && <div className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span>{m.hours}</span></div>}
                        {m.season && <div className="flex items-start gap-2"><CalIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span>{m.season}</span></div>}
                      </div>
                    </div>
                    {m.address && (
                      <Button asChild variant="outline" size="sm">
                        <a href={`https://maps.google.com/?q=${encodeURIComponent([m.address, m.city, m.state].filter(Boolean).join(", "))}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="h-fit lg:sticky lg:top-24">
            <CardContent className="p-0">
              <div className="grid aspect-square place-items-center bg-gradient-to-br from-primary/10 via-accent/10 to-primary/20 lg:aspect-auto lg:h-[500px]">
                <div className="text-center">
                  <MapPin className="mx-auto h-10 w-10 text-primary" />
                  <p className="mt-3 font-serif text-lg font-semibold text-primary">Map view</p>
                  <p className="mt-1 text-sm text-muted-foreground">Interactive map coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
