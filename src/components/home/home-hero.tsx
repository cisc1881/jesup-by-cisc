import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { HomeHeroSlide } from "@/lib/home";
import { cn } from "@/lib/utils";

type HomeHeroProps = { slides: HomeHeroSlide[] };

export function HomeHero({ slides }: HomeHeroProps) {
  const [selected, setSelected] = useState(0);
  const safeSelected = slides.length > 0 ? selected % slides.length : 0;
  const active = slides[safeSelected];

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(
      () => setSelected((current) => (current + 1) % slides.length),
      7000,
    );
    return () => window.clearInterval(id);
  }, [slides.length]);

  function changeSlide(direction: -1 | 1) {
    if (slides.length <= 1) return;
    setSelected((current) => (current + direction + slides.length) % slides.length);
  }

  return (
    <section className="relative isolate w-full overflow-hidden bg-slate-950 text-white">
      <div className="relative min-h-[520px] sm:min-h-[600px]">
        {slides.map((slide, index) => (
          <img
            key={slide.id}
            src={slide.imageUrl}
            alt={index === safeSelected ? slide.imageAlt : ""}
            aria-hidden={index !== safeSelected}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
              index === safeSelected ? "opacity-100" : "opacity-0",
            )}
            fetchPriority={index === 0 ? "high" : "auto"}
            loading={index === 0 ? "eager" : "lazy"}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20" />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(13,24,63,.88)_0%,rgba(13,24,63,.28)_65%,transparent_100%)]" />

        <div className="relative mx-auto flex min-h-[520px] max-w-7xl flex-col justify-end px-4 pb-14 pt-20 sm:min-h-[600px] sm:px-6 sm:pb-16">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--institution-accent)]">
              Featured across the 1890 network
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl">
              {active?.title ?? "Extension, research, and major events—connected through JESUP."}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
              {active?.subtitle ??
                "Build your agenda, discover opportunities, and stay connected across AEA, ARD, and the 1890 Land-Grant network."}
            </p>
            <div className="mt-8 flex items-center gap-3">
              {active?.linkLabel ? (
                <Link
                  to={active.linkTo}
                  {...(active.linkParams ? { params: active.linkParams } : {})}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full institution-accent-bg px-6 text-sm font-extrabold shadow-xl transition hover:brightness-105"
                >
                  {active.linkLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  to="/events"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full institution-accent-bg px-6 text-sm font-extrabold shadow-xl"
                >
                  Explore events <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {slides.length > 1 ? (
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeSlide(-1)}
                    className="grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-black/20 backdrop-blur hover:bg-white/15"
                    aria-label="Previous featured item"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => changeSlide(1)}
                    className="grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-black/20 backdrop-blur hover:bg-white/15"
                    aria-label="Next featured item"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              ) : null}
            </div>
            {slides.length > 1 ? (
              <div className="mt-6 flex gap-2" aria-label="Featured item selection">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setSelected(index)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === safeSelected
                        ? "w-10 bg-[var(--institution-accent)]"
                        : "w-3 bg-white/35",
                    )}
                    aria-label={`Show ${slide.imageAlt}`}
                    aria-current={index === safeSelected ? "true" : undefined}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
