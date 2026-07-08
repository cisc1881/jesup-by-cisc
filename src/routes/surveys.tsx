import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/surveys")({
  head: () => ({ meta: [{ title: "Surveys · CISC Connect" }, { name: "description", content: "Help shape CISC programs by taking a short survey." }] }),
  component: SurveysPage,
});

function SurveysPage() {
  const { data } = useQuery({
    queryKey: ["surveys"],
    queryFn: async () => {
      const { data, error } = await supabase.from("surveys").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <PublicLayout>
      <PageHeader title="Surveys" description="Your voice helps shape our programs." />
      <div className="mx-auto max-w-5xl px-4 py-8 grid gap-4 md:grid-cols-2">
        {(!data || data.length === 0) && <p className="text-muted-foreground">No active surveys at this time.</p>}
        {data?.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-6">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary"><ClipboardList className="h-5 w-5" /></div>
              <h3 className="mt-3 font-serif text-lg font-semibold text-primary">{s.title}</h3>
              {s.description && <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>}
              <Button asChild className="mt-4"><a href={s.qualtrics_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" />Take survey</a></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PublicLayout>
  );
}
