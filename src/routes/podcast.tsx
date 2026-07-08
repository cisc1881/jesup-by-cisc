import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { supabase } from "@/integrations/supabase/client";
import { Play, Clock, Mic } from "lucide-react";
import podcastHero from "@/assets/jesup/podcast-hero.jpg";

export const Route = createFileRoute("/podcast")({
  head: () => ({
    meta: [
      { title: "Podcast · JESUP" },
      { name: "description", content: "Conversations from the field — the JESUP podcast." },
      { property: "og:title", content: "JESUP Podcast" },
      { property: "og:description", content: "Conversations from the field with farmers, researchers, and community leaders." },
    ],
  }),
  component: PodcastPage,
});

function fmtDuration(sec?: number | null) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function PodcastPage() {
  const { data } = useQuery({
    queryKey: ["podcast-episodes"],
    queryFn: async () => (await supabase.from("podcast_episodes").select("*").eq("is_published", true).order("published_at", { ascending: false, nullsFirst: false })).data ?? [],
  });

  const featured = data?.[0];
  const rest = data?.slice(1) ?? [];

  return (
    <PublicLayout>
      {/* Spotify-style hero */}
      <section className="relative overflow-hidden bg-foreground text-white">
        <div className="absolute inset-0 opacity-40">
          <img src={podcastHero} alt="" className="h-full w-full object-cover" fetchPriority="high" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/85 to-foreground/40" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:flex-row sm:items-end sm:px-6 sm:py-20">
          <div className="relative h-52 w-52 shrink-0 overflow-hidden rounded-3xl shadow-2xl sm:h-64 sm:w-64">
            <img src={featured?.cover_url || podcastHero} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] grad-gold-text">Podcast · JESUP</div>
            <h1 className="text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">Conversations from the field</h1>
            <p className="mt-3 max-w-xl text-white/80">Stories with farmers, researchers, and community leaders — hosted by the Carver Integrative Sustainability Center.</p>
            <div className="mt-6 flex items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-foreground shadow-lg transition hover:scale-[1.02]">
                <Play className="h-4 w-4 fill-current" /> Play latest
              </button>
              <div className="text-xs text-white/70">{data?.length ?? 0} episode{data?.length === 1 ? "" : "s"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Episodes */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <h2 className="mb-6 text-2xl font-black tracking-tight">All episodes</h2>
        {(!data || data.length === 0) ? (
          <div className="rounded-3xl bg-card p-12 text-center shadow-[var(--shadow-soft)]">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary text-muted-foreground">
              <Mic className="h-6 w-6" />
            </div>
            <p className="mt-4 font-bold">Episodes coming soon</p>
            <p className="mt-1 text-sm text-muted-foreground">Our first drop is in production.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {featured && <EpisodeRow ep={featured} featured />}
            {rest.map((ep) => <EpisodeRow key={ep.id} ep={ep} />)}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}

function EpisodeRow({ ep, featured }: { ep: any; featured?: boolean }) {
  return (
    <div className={`group flex gap-4 rounded-2xl bg-card p-3 shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-lift)] sm:p-4 ${featured ? "ring-1 ring-primary/20" : ""}`}>
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary sm:h-28 sm:w-28">
        {ep.cover_url ? <img src={ep.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full grad-crimson" />}
        <button className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/30">
          <span className="grid h-11 w-11 translate-y-1 place-items-center rounded-full bg-white text-foreground opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100">
            <Play className="h-4 w-4 fill-current" />
          </span>
        </button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          {ep.category && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{ep.category}</span>}
          {featured && <span className="rounded-full grad-crimson px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Latest</span>}
        </div>
        <h3 className="mt-1 line-clamp-2 text-base font-bold text-foreground sm:text-lg">{ep.title}</h3>
        {ep.guest && <div className="text-xs text-muted-foreground">with {ep.guest}</div>}
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ep.description}</p>
        {ep.duration_seconds && (
          <div className="mt-auto flex items-center gap-1 pt-2 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" /> {fmtDuration(ep.duration_seconds)}
          </div>
        )}
      </div>
    </div>
  );
}
