import { Link } from "@tanstack/react-router";
import { AppButton } from "@/components/design-system";

export function PartnersPageHero() {
  return (
    <section className="relative overflow-hidden grad-crimson text-primary-foreground">
      <div className="absolute inset-0 opacity-20" aria-hidden="true">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-eyebrow grad-gold-text">Collaboration</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-[var(--tracking-tight)] sm:text-5xl">
          Strategic Partners
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
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
            className="bg-white/15 text-primary-foreground hover:bg-white/25"
            asChild
          >
            <Link to="/programs">View Programs</Link>
          </AppButton>
        </div>
      </div>
    </section>
  );
}
