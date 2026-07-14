import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { HomeCta } from "@/lib/home";
import { AppButton, AppCard } from "@/components/design-system";

type HomeCtaSectionProps = {
  cta: HomeCta | null;
};

export function HomeCtaSection({ cta }: HomeCtaSectionProps) {
  if (!cta) return null;

  return (
    <section aria-labelledby="home-cta-heading">
      <AppCard
        variant="lift"
        padding="lg"
        className="relative overflow-hidden border-0 grad-crimson text-primary-foreground shadow-token-crimson"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          aria-hidden="true"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 max-w-xl">
            {cta.eyebrow && <p className="text-eyebrow grad-gold-text">{cta.eyebrow}</p>}
            <h2 id="home-cta-heading" className="mt-1 text-2xl font-black tracking-[var(--tracking-tight)] sm:text-3xl">
              {cta.title}
            </h2>
            {cta.body && <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-base">{cta.body}</p>}
          </div>
          <AppButton variant="inverse" size="lg" shape="pill" className="shrink-0 self-start" asChild>
            <Link to={cta.linkTo} {...(cta.linkParams ? { params: cta.linkParams } : {})}>
              {cta.buttonLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </AppButton>
        </div>
      </AppCard>
    </section>
  );
}
