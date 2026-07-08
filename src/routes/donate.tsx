import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { Heart, GraduationCap, Sprout, FlaskConical, ArrowRight } from "lucide-react";
import donateHero from "@/assets/jesup/donate-hero.jpg";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Donate · JESUP" },
      { name: "description", content: "Support the Carver Integrative Sustainability Center and the communities we serve." },
      { property: "og:title", content: "Give to JESUP" },
      { property: "og:description", content: "Every gift powers programs, students, and research across the Black Belt." },
      { property: "og:image", content: donateHero },
    ],
  }),
  component: DonatePage,
});

const ways = [
  { icon: Sprout, title: "Sponsor programs", body: "Fund workshops, summer academies, and community-driven initiatives across the Black Belt." },
  { icon: GraduationCap, title: "Support students", body: "Back the next generation of agricultural specialists through the 2FAS pipeline and internships." },
  { icon: FlaskConical, title: "Support research", body: "Advance applied research on sustainable food systems, energy, and economic development." },
];

function DonatePage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative h-[440px] w-full overflow-hidden sm:h-[540px]">
          <img src={donateHero} alt="" className="h-full w-full object-cover" fetchPriority="high" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(122,12,22,0.65) 60%, rgba(122,12,22,0.9) 100%)" }} />
          <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-end px-5 pb-14 text-center text-white sm:pb-20">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] backdrop-blur">
              <Heart className="h-3.5 w-3.5" /> Give
            </div>
            <h1 className="text-5xl font-black leading-[1.02] tracking-tight sm:text-7xl">Grow with us.</h1>
            <p className="mt-4 max-w-2xl text-lg text-white/90">Your gift builds pipelines to opportunity — for farmers, families, and future leaders across the Black Belt and beyond.</p>
            <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-primary shadow-2xl transition hover:scale-[1.02]">
              Give online <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-xs text-white/60">Online giving portal · coming soon</p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] grad-gold-text">Our mission</div>
        <p className="text-xl leading-relaxed text-foreground sm:text-2xl">
          The Carver Integrative Sustainability Center advances integrated, community-driven approaches to sustainable food systems, economic opportunity, and workforce development — grounded in Tuskegee's legacy of service.
        </p>
      </section>

      {/* Ways to give */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="mb-8 text-center">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] grad-gold-text">Ways to give</div>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Every gift compounds.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {ways.map((w) => (
            <div key={w.title} className="group rounded-3xl bg-card p-8 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
              <span className="grid h-14 w-14 place-items-center rounded-2xl grad-crimson text-white shadow-[var(--shadow-crimson)]">
                <w.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-black tracking-tight">{w.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{w.body}</p>
              <button className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary transition group-hover:gap-2.5">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Contact strip */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl bg-foreground p-8 text-white sm:p-12">
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] grad-gold-text">Major gifts & partnerships</div>
              <h3 className="text-2xl font-black tracking-tight sm:text-3xl">Talk with our team.</h3>
              <p className="mt-2 max-w-xl text-white/70">For sponsorships, endowments, and multi-year partnerships, our development team is ready to design a gift that fits your goals.</p>
            </div>
            <a href="mailto:cisc@tuskegee.edu" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-foreground transition hover:scale-[1.02]">
              Contact us <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
