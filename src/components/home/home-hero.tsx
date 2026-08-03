import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Radio, Sparkles, Van } from "lucide-react";
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
    <section className="relative isolate w-full overflow-hidden bg-[#004aad] text-white">
      <div className="absolute inset-0 bg-[var(--gradient-jesup)]" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:48px_48px]"
        aria-hidden="true"
      />
      <div
        className="absolute -right-28 -top-36 h-[32rem] w-[32rem] rounded-full border-[72px] border-white/10"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-48 right-[18%] h-96 w-96 rounded-full bg-white/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[500px] max-w-7xl flex-col justify-center px-5 py-20 sm:min-h-[580px] sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 border border-white/40 bg-white/10 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.18em] backdrop-blur">
              <Sparkles className="h-4 w-4" /> Digital extension for the 1890 network
            </p>
            <h1 className="mt-6 text-4xl font-black leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl">
              {active?.title ?? "Extension, research, and major events—connected through JESUP."}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
              {active?.subtitle ??
                "Build your agenda, discover opportunities, and stay connected across AEA, ARD, and the 1890 Land-Grant network."}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to={active?.linkTo ?? "/events"}
                {...(active?.linkParams ? { params: active.linkParams } : {})}
                className="inline-flex min-h-12 items-center gap-2 bg-white px-6 text-sm font-extrabold text-[#004aad] shadow-xl transition hover:bg-slate-100"
              >
                {active?.linkLabel ?? "Explore events"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {slides.length > 1 && (
                <div className="ml-auto flex items-center gap-2 sm:ml-2">
                  <button
                    type="button"
                    onClick={() => changeSlide(-1)}
                    className="grid h-12 w-12 place-items-center border border-white/35 bg-black/10 hover:bg-white/15"
                    aria-label="Previous featured item"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => changeSlide(1)}
                    className="grid h-12 w-12 place-items-center border border-white/35 bg-black/10 hover:bg-white/15"
                    aria-label="Next featured item"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
            {slides.length > 1 && (
              <div className="mt-7 flex gap-2" aria-label="Featured item selection">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setSelected(index)}
                    className={cn(
                      "h-1.5 transition-all",
                      index === safeSelected ? "w-10 bg-white" : "w-3 bg-white/35",
                    )}
                    aria-label={`Show ${slide.imageAlt}`}
                    aria-current={index === safeSelected ? "true" : undefined}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hidden border-l border-white/25 pl-10 lg:block" aria-hidden="true">
            <Van className="h-20 w-20 text-white" strokeWidth={1.35} />
            <div className="mt-8 space-y-5 text-sm font-bold text-white/90">
              <p className="flex items-center gap-3">
                <Radio className="h-5 w-5" /> One connected network
              </p>
              <p className="border-t border-white/20 pt-5">Programs · Conferences · Resources</p>
              <p className="border-t border-white/20 pt-5">
                Built for communities and institutions
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
