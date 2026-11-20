import { Link } from "@tanstack/react-router";
import { AppButton } from "@/components/design-system";

export function PartnersPageHero() {
  return (
    <section className="relative isolate overflow-hidden bg-black text-white">
      <img src="/images/partners-collaboration.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-center" fetchPriority="high" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/50" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-eyebrow text-[#75a9ff]">Collaboration</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-[var(--tracking-tight)] sm:text-5xl">
          Strategic Partners
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
          Building stronger communities through collaboration, research, education, innovation, and sustainable
          development.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <AppButton variant="inverse" size="lg" shape="pill" asChild>
            <a href="mailto:info@cisc1881.org?subject=Become%20a%20JESUP%20Partner">Become a Partner</a>
          </AppButton>
          <AppButton
            variant="secondary"
            size="lg"
            shape="pill"
            className="border border-[#75a9ff] bg-[#1764d4]/35 text-white hover:bg-[#1764d4]/55"
            asChild
          >
            <Link to="/programs">View Programs</Link>
          </AppButton>
        </div>
      </div>
    </section>
  );
}
