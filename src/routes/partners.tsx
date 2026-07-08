import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Building2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Partners · JESUP" },
      { name: "description", content: "The organizations, universities, and community leaders that power CISC." },
      { property: "og:title", content: "Partners · JESUP" },
      { property: "og:description", content: "Building sustainable communities together." },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  const [cat, setCat] = useState<string>("All");
  const { data } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => (await supabase.from("partners").select("*").eq("is_published", true).order("sort_order", { ascending: true }).order("name", { ascending: true })).data ?? [],
  });

  const categories = ["All", ...Array.from(new Set((data ?? []).map((p) => p.category).filter(Boolean) as string[]))];
  const filtered = (data ?? []).filter((p) => cat === "All" || p.category === cat);

  return (
    <PublicLayout>
      <PageHeader eyebrow="Together" title="Our partners" description="We build with universities, government agencies, community organizations, and industry — because sustainable change is never a solo effort." />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {categories.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${cat === c ? "grad-crimson text-white" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {c}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-3xl bg-card p-16 text-center shadow-[var(--shadow-soft)]">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary text-muted-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <p className="mt-4 font-bold">Partners coming soon</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div key={p.id} className="group flex flex-col rounded-3xl bg-card p-6 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
                <div className="grid h-20 place-items-center overflow-hidden rounded-2xl bg-secondary/60">
                  {p.logo_url ? <img src={p.logo_url} alt={p.name} className="max-h-16 max-w-[80%] object-contain" loading="lazy" /> : <span className="text-lg font-black text-muted-foreground">{p.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}</span>}
                </div>
                <div className="mt-4 flex-1">
                  {p.category && <div className="text-[10px] font-semibold uppercase tracking-widest grad-gold-text">{p.category}</div>}
                  <h3 className="mt-1 text-lg font-black tracking-tight text-foreground">{p.name}</h3>
                  {p.description && <p className="mt-1.5 text-sm text-muted-foreground">{p.description}</p>}
                </div>
                {p.website_url && (
                  <a href={p.website_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-primary hover:text-white">
                    Visit <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
