import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { HomeHeroSlide } from "@/lib/home";
import { AppButton, BrandMark } from "@/components/design-system";
import { cn } from "@/lib/utils";

type HomeHeroProps = {
  slides: HomeHeroSlide[];
};

function welcomeLabel(email?: string | null) {
  if (!email) return "Welcome";
  const name = email.split("@")[0]?.split(/[._-]/)[0];
  if (!name) return "Welcome back";
  return `Welcome, ${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

export function HomeHero({ slides }: HomeHeroProps) {
  const { user } = useAuth();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: slides.length > 1, align: "start" });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi || slides.length <= 1) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    const id = setInterval(() => emblaApi.scrollNext(), 7000);
    return () => {
      clearInterval(id);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, slides.length]);

  const active = slides[selected] ?? slides[0];

  return (
    <section className="relative isolate overflow-hidden grad-crimson">
      <div className="absolute inset-0 opacity-20" aria-hidden="true">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {slides.length > 0 ? (
        <div className="absolute inset-0" ref={emblaRef}>
          <div className="flex h-full">
            {slides.map((slide, i) => (
              <div key={slide.id} className="relative min-w-0 flex-[0_0_100%]">
                <img
                  src={slide.imageUrl}
                  alt={slide.imageAlt}
                  className="absolute inset-0 h-full w-full object-cover"
                  fetchPriority={i === 0 ? "high" : "auto"}
                  loading={i === 0 ? "eager" : "lazy"}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, color-mix(in oklch, var(--primary) 75%, transparent) 55%, color-mix(in oklch, var(--primary) 92%, transparent) 100%)",
                  }}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 hero-overlay opacity-60" aria-hidden="true" />
      )}

      <div className="relative z-10 mx-auto flex min-h-[min(72vh,520px)] max-w-7xl flex-col justify-between page-x pb-8 pt-6 sm:min-h-[min(68vh,580px)] sm:pb-10 sm:pt-8">
        <BrandMark variant="light" />

        <div className="mt-auto space-y-4">
          <div>
            <p className="text-eyebrow grad-gold-text">{welcomeLabel(user?.email)}</p>
            {active?.title && (
              <h1 className="mt-2 max-w-xl text-[2rem] font-black leading-[1.05] tracking-[var(--tracking-tight)] text-white sm:text-5xl">
                {active.title}
              </h1>
            )}
            {active?.subtitle && (
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base line-clamp-3">
                {active.subtitle}
              </p>
            )}
          </div>

          {active?.linkLabel && (
            <AppButton variant="inverse" size="lg" shape="pill" asChild>
              <Link to={active.linkTo} {...(active.linkParams ? { params: active.linkParams } : {})}>
                {active.linkLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </AppButton>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="relative z-10 flex justify-center gap-1.5 pb-6">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === selected ? "w-8 bg-white" : "w-1.5 bg-white/45",
              )}
              aria-label={slide.imageAlt}
              aria-current={i === selected ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
