import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/format";
import { Download, ExternalLink, FileText } from "lucide-react";

export const Route = createFileRoute("/publications")({
  head: () => ({ meta: [{ title: "Publications · CISC Connect" }, { name: "description", content: "Research briefs, community guides and publications from CISC." }] }),
  component: PublicationsPage,
});

function PublicationsPage() {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["publications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("publications").select("*").order("published_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });
  const filtered = (data ?? []).filter((p) => !q || p.title.toLowerCase().includes(q.toLowerCase()) || (p.category ?? "").toLowerCase().includes(q.toLowerCase()));

  return (
    <PublicLayout>
      <PageHeader title="Publications Library" description="Reports, briefs, and community-facing guides." />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Input placeholder="Search publications…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-6 max-w-sm" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 && <p className="text-muted-foreground">No publications yet.</p>}
          {filtered.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-6">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
                {p.category && <Badge variant="secondary" className="mt-3 w-fit">{p.category}</Badge>}
                <h3 className="mt-2 font-serif text-lg font-semibold text-primary">{p.title}</h3>
                {p.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{p.description}</p>}
                {p.published_at && <p className="mt-2 text-xs text-muted-foreground">{fmtDate(p.published_at)}</p>}
                <div className="mt-4 flex gap-2">
                  {p.file_url && (
                    <Button asChild size="sm"><a href={p.file_url} target="_blank" rel="noreferrer"><Download className="mr-1 h-4 w-4" />Download</a></Button>
                  )}
                  {p.external_url && (
                    <Button asChild size="sm" variant="outline"><a href={p.external_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" />Open</a></Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
