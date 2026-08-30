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
    <section className="w-full bg-muted/45 px-1 py-7 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl border border-border bg-background px-7 py-10 sm:px-10 sm:py-12">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
            Digital extension
          </p>
          <h1 className="mt-5 text-3xl font-medium leading-[1.12] tracking-[-0.04em] text-foreground sm:text-5xl">
            {active?.title ?? "Extension, research, and major events—connected through JESUP."}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {active?.subtitle ??
              "Build your agenda, discover opportunities, and stay connected across AEA, ARD, and the 1890 Land-Grant network."}
          </p>
          <div className="mt-7 flex items-end gap-3">
            <Link
              to={active?.linkTo ?? "/events"}
              {...(active?.linkParams ? { params: active.linkParams } : {})}
              className="inline-flex min-h-12 items-center gap-2 bg-foreground px-6 text-sm font-extrabold text-background transition hover:opacity-85"
            >
              {active?.linkLabel ?? "Explore events"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {slides.length > 1 && (
              <div className="ml-auto flex items-center gap-2 sm:ml-2">
                <button
                  type="button"
                  onClick={() => changeSlide(-1)}
                  className="grid h-10 w-10 place-items-center border border-border bg-background text-foreground hover:bg-muted"
                  aria-label="Previous featured item"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => changeSlide(1)}
                  className="grid h-10 w-10 place-items-center border border-border bg-background text-foreground hover:bg-muted"
                  aria-label="Next featured item"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
          {slides.length > 1 && (
            <div className="mt-6 flex gap-2" aria-label="Featured item selection">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setSelected(index)}
                  className={cn(
                    "h-1.5 transition-all",
                    index === safeSelected ? "w-10 bg-foreground" : "w-3 bg-muted-foreground/30",
                  )}
                  aria-label={`Show ${slide.imageAlt}`}
                  aria-current={index === safeSelected ? "true" : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
