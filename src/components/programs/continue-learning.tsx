import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { productDb } from "@/lib/product-db";

export function ContinueLearning({ programId }: { programId: string }) {
  const { data: resources = [] } = useQuery({
    queryKey: ["continue-learning", "program", programId],
    queryFn: async () => {
      const { data: links, error } = await productDb
        .from("extension_links")
        .select("target_type,target_id,relationship")
        .eq("source_type", "program")
        .eq("source_id", programId)
        .eq("is_public", true);
      if (error?.code === "PGRST205" || error?.code === "42P01") return [];
      if (error) throw error;
      const publicationIds = (links ?? [])
        .filter((link) => link.target_type === "publication")
        .map((link) => link.target_id);
      const programIds = (links ?? [])
        .filter((link) => link.target_type === "program")
        .map((link) => link.target_id);
      const [publications, programs] = await Promise.all([
        publicationIds.length
          ? supabase
              .from("publications")
              .select("id,title,slug")
              .in("id", publicationIds)
              .eq("is_active", true)
              .not("published_at", "is", null)
              .not("slug", "is", null)
          : Promise.resolve({ data: [] }),
        programIds.length
          ? supabase
              .from("programs")
              .select("id,name,slug")
              .in("id", programIds)
              .eq("is_active", true)
          : Promise.resolve({ data: [] }),
      ]);
      return [
        ...(publications.data ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          href: `/publications/${item.slug}`,
          type: "Publication",
        })),
        ...(programs.data ?? []).map((item) => ({
          id: item.id,
          title: item.name,
          href: `/programs/${item.slug}`,
          type: "Program",
        })),
      ];
    },
  });
  if (resources.length === 0) return null;
  return (
    <section className="mt-14 border-t pt-8" aria-labelledby="continue-learning-heading">
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-primary" />
        <h2 id="continue-learning-heading" className="text-2xl font-black">
          Continue learning
        </h2>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {resources.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="flex min-h-20 items-center gap-4 rounded-2xl border bg-card p-4 hover:bg-muted/50"
          >
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {item.type}
              </p>
              <h3 className="mt-1 font-bold">{item.title}</h3>
            </div>
            <ArrowRight className="h-5 w-5 text-primary" />
          </a>
        ))}
      </div>
    </section>
  );
}
