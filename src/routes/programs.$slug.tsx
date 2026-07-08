import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { getProgram, programs } from "@/lib/programs";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/programs/$slug")({
  loader: ({ params }) => {
    const program = getProgram(params.slug);
    if (!program) throw notFound();
    return { program };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Program not found · JESUP" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.program;
    return {
      meta: [
        { title: `${p.name} · JESUP` },
        { name: "description", content: p.tagline },
        { property: "og:title", content: `${p.name} · JESUP` },
        { property: "og:description", content: p.tagline },
      ],
    };
  },
  component: ProgramDetail,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-black tracking-tight">Program not found</h1>
        <p className="mt-2 text-muted-foreground">This program doesn't exist.</p>
        <Link to="/programs" className="mt-6 inline-flex rounded-full grad-crimson px-5 py-2.5 text-sm font-bold text-white">Back to programs</Link>
      </div>
    </PublicLayout>
  ),
  errorComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-black">Something went wrong</h1>
      </div>
    </PublicLayout>
  ),
});

function ProgramDetail() {
  const { program } = Route.useLoaderData();
  const related = programs.filter((p) => p.slug !== program.slug).slice(0, 3);

  return (
    <PublicLayout>
      <section className="relative">
        <div className="relative h-[380px] w-full overflow-hidden sm:h-[480px]">
          <img src={program.image} alt={program.name} className="h-full w-full object-cover" fetchPriority="high" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(122,12,22,0.6) 60%, rgba(122,12,22,0.9) 100%)" }} />
          <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-10 sm:px-8 sm:pb-14">
            <Link to="/programs" className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/25">
              <ArrowLeft className="h-3.5 w-3.5" /> All programs
            </Link>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {program.tags.map((t: string) => (
                <span key={t} className="rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">{t}</span>
              ))}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] grad-gold-text">{program.short}</div>
            <h1 className="mt-2 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">{program.name}</h1>
            <p className="mt-3 max-w-2xl text-lg text-white/90">{program.tagline}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-lg leading-relaxed text-foreground/80">{program.description}</p>
        <div className="gold-divider my-10" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/events" className="group flex items-center justify-between rounded-2xl bg-card p-5 shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-lift)]">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Upcoming</div>
              <div className="mt-0.5 font-bold text-foreground">Events & workshops</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
          <Link to="/publications" className="group flex items-center justify-between rounded-2xl bg-card p-5 shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-lift)]">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Research</div>
              <div className="mt-0.5 font-bold text-foreground">Related publications</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <h2 className="mb-5 text-2xl font-black tracking-tight">More programs</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {related.map((p) => (
            <Link key={p.slug} to="/programs/$slug" params={{ slug: p.slug }} className="group overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-lift)]">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={p.image} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="p-4">
                <div className="text-[10px] font-semibold uppercase tracking-widest grad-gold-text">{p.short}</div>
                <h3 className="mt-1 line-clamp-1 font-bold text-foreground">{p.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
