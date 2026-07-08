import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { PublicLayout, PageHeader } from "@/components/public-layout";
import { programs } from "@/lib/programs";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "Programs · JESUP" },
      { name: "description", content: "Signature programs from the Carver Integrative Sustainability Center." },
      { property: "og:title", content: "Programs · JESUP" },
      { property: "og:description", content: "Ten signature initiatives serving farmers, students, and communities." },
    ],
  }),
  component: ProgramsLayout,
});

function ProgramsLayout() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId === "/programs/$slug");
  if (isChild) return <Outlet />;
  return (
    <PublicLayout>
      <PageHeader eyebrow="Signature initiatives" title="Programs" description="Ten programs advancing sustainable food systems, workforce development, and community resilience across the Black Belt." />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <Link key={p.slug} to="/programs/$slug" params={{ slug: p.slug }} className="group relative overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <img src={p.image} alt={p.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">{t}</span>
                    ))}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest grad-gold-text">{p.short}</div>
                  <h3 className="mt-1 text-xl font-black leading-tight tracking-tight">{p.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-white/85">{p.tagline}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
