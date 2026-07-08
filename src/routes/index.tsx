import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout, SectionHeader } from "@/components/public-layout";
import { HeroCarousel } from "@/components/hero-carousel";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime, fmtDate } from "@/lib/format";
import { ArrowRight, Calendar, MapPin, BookOpen, DollarSign, Briefcase, Package, Mic, Heart, LayoutGrid, Cloud, Sun } from "lucide-react";
import { programs } from "@/lib/programs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JESUP · The Digital Extension Wagon" },
      { name: "description", content: "Programs, workshops, publications, and opportunities from the Carver Integrative Sustainability Center at Tuskegee University." },
      { property: "og:title", content: "JESUP · The Digital Extension Wagon" },
      { property: "og:description", content: "A premium digital home for Tuskegee's Cooperative Extension programs." },
    ],
  }),
  component: Home,
});

const quickActions = [
  { to: "/programs", label: "Programs", icon: LayoutGrid },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/podcast", label: "Podcast", icon: Mic },
  { to: "/donate", label: "Donate", icon: Heart },
  { to: "/resources", label: "Resources", icon: BookOpen },
  { to: "/equipment", label: "Equipment", icon: Package },
] as const;

function Home() {
  const { data: events } = useQuery({
    queryKey: ["home-events"],
    queryFn: async () => (await supabase.from("events").select("id,title,starts_at,location,image_url").gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }).limit(4)).data ?? [],
  });
  const { data: pubs } = useQuery({
    queryKey: ["home-pubs"],
    queryFn: async () => (await supabase.from("publications").select("id,title,description,published_at").order("published_at", { ascending: false, nullsFirst: false }).limit(4)).data ?? [],
  });

  const featuredProgram = programs[0];
  const nextEvent = events?.[0];
  const latestPub = pubs?.[0];

  const today = new Date();
  const todayLabel = today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  return (
    <PublicLayout>
      <HeroCarousel />

      {/* Today strip */}
      <section className="mx-auto -mt-10 max-w-7xl px-4 sm:px-6">
        <div className="relative z-20 grid gap-3 rounded-3xl bg-card p-4 shadow-[var(--shadow-lift)] sm:grid-cols-3 sm:p-5">
          <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl grad-crimson text-white">
              <Sun className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Today</div>
              <div className="truncate text-sm font-bold text-foreground">{todayLabel}</div>
              <div className="text-xs text-muted-foreground">Tuskegee · 78°F Partly sunny</div>
            </div>
          </div>
          <Link to="/events" className="group flex items-center gap-3 rounded-2xl bg-secondary/50 p-3 transition hover:bg-secondary">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-foreground text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Next workshop</div>
              <div className="truncate text-sm font-bold text-foreground">{nextEvent?.title ?? "No upcoming workshop"}</div>
              <div className="truncate text-xs text-muted-foreground">{nextEvent ? fmtDateTime(nextEvent.starts_at) : "Check back soon"}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
          <Link to="/publications" className="group flex items-center gap-3 rounded-2xl bg-secondary/50 p-3 transition hover:bg-secondary">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Latest publication</div>
              <div className="truncate text-sm font-bold text-foreground">{latestPub?.title ?? "New research coming"}</div>
              <div className="truncate text-xs text-muted-foreground">{latestPub?.published_at ? fmtDate(latestPub.published_at) : "Coming soon"}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeader eyebrow="Explore" title="Quick actions" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to} className="group flex flex-col items-center gap-2 rounded-2xl bg-card p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
              <span className="grid h-12 w-12 place-items-center rounded-2xl grad-crimson text-white transition group-hover:scale-105">
                <a.icon className="h-5 w-5" />
              </span>
              <span className="text-center text-[12px] font-semibold text-foreground">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured program */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <SectionHeader eyebrow="Featured program" title={featuredProgram.name} action={<Link to="/programs" className="hidden text-sm font-semibold text-primary hover:underline sm:inline">See all →</Link>} />
        <Link to="/programs/$slug" params={{ slug: featuredProgram.slug }} className="group block overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-lift)]">
          <div className="relative h-64 w-full overflow-hidden sm:h-80">
            <img src={featuredProgram.image} alt={featuredProgram.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
              <div className="mb-2 flex gap-2">
                {featuredProgram.tags.slice(0, 2).map((t) => (
                  <span key={t} className="rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">{t}</span>
                ))}
              </div>
              <h3 className="text-2xl font-black tracking-tight sm:text-3xl">{featuredProgram.short}</h3>
              <p className="mt-1 max-w-lg text-sm text-white/85 sm:text-base">{featuredProgram.tagline}</p>
            </div>
          </div>
        </Link>
      </section>

      {/* Upcoming */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeader eyebrow="This month" title="Upcoming events" action={<Link to="/events" className="text-sm font-semibold text-primary hover:underline">View all</Link>} />
        {events && events.length > 0 ? (
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {events.map((e) => (
              <Link key={e.id} to="/events/$id" params={{ id: e.id }} className="group w-[75vw] shrink-0 snap-start overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-lift)] sm:w-auto">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                  {e.image_url ? <img src={e.image_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" /> : <div className="h-full w-full grad-crimson" />}
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-widest grad-gold-text">{fmtDateTime(e.starts_at)}</div>
                  <h3 className="mt-1 line-clamp-2 text-[15px] font-bold text-foreground">{e.title}</h3>
                  {e.location && <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{e.location}</p>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-[var(--shadow-soft)]">No upcoming events yet. Check back soon.</div>
        )}
      </section>

      {/* Programs preview */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-14">
        <SectionHeader eyebrow="Signature initiatives" title="Programs" action={<Link to="/programs" className="text-sm font-semibold text-primary hover:underline">See all 10</Link>} />
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {programs.slice(0, 6).map((p) => (
            <Link key={p.slug} to="/programs/$slug" params={{ slug: p.slug }} className="group relative w-[75vw] shrink-0 snap-start overflow-hidden rounded-3xl shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-lift)] sm:w-auto">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-secondary">
                <img src={p.image} alt={p.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-white/70">{p.tags[0]}</div>
                  <h3 className="mt-1 text-xl font-black tracking-tight">{p.short}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-white/80">{p.tagline}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Donation CTA band */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl grad-crimson p-8 text-white shadow-[var(--shadow-crimson)] sm:p-12">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] grad-gold-text">Support the mission</div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Help us plant the next generation.</h2>
              <p className="mt-2 text-white/85">Every gift powers programs, students, and research across the Black Belt.</p>
            </div>
            <Link to="/donate" className="inline-flex items-center gap-2 self-start rounded-full bg-white px-6 py-3 text-sm font-bold text-primary shadow-lg transition hover:scale-[1.02]">
              Give today <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
