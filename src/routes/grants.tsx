import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/format";
import { ExternalLink, DollarSign } from "lucide-react";

import { listPageHead } from "@/lib/seo";

export const Route = createFileRoute("/grants")({
  head: () =>
    listPageHead({
      title: "Grants",
      description: "Grant opportunities for community and sustainability projects across the Black Belt.",
      path: "/grants",
    }),
  component: GrantsPage,
});

function GrantsPage() {
  const { data } = useQuery({
    queryKey: ["grants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grants").select("*").order("deadline", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <PublicLayout>
      <PageHeader title="Grant Opportunities" description="Funding to help move your community project forward." />
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        {(!data || data.length === 0) && <p className="text-muted-foreground">No open grants at this time.</p>}
        {data?.map((g) => (
          <Card key={g.id}>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium uppercase tracking-wider text-accent">{g.funder}</div>
                  <h3 className="mt-1 font-serif text-lg font-semibold text-primary">{g.title}</h3>
                  {g.description && <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    {g.amount && <span className="flex items-center gap-1"><DollarSign className="h-4 w-4 text-accent" />{g.amount}</span>}
                    {g.deadline && <span className="text-muted-foreground">Deadline: {fmtDate(g.deadline)}</span>}
                  </div>
                </div>
                {g.url && (
                  <Button asChild><a href={g.url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" />Apply</a></Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PublicLayout>
  );
}
