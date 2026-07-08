import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import hero1 from "@/assets/jesup/hero-1.jpg";
import hero2 from "@/assets/jesup/hero-2.jpg";
import hero3 from "@/assets/jesup/hero-3.jpg";

type Slide = { img: string; eyebrow: string; title: string; body: string; to: string; cta: string };

const slides: Slide[] = [
  { img: hero1, eyebrow: "Welcome to JESUP", title: "The Digital Extension Wagon", body: "Programs, resources, and opportunities from the Carver Integrative Sustainability Center at Tuskegee University.", to: "/programs", cta: "Explore programs" },
  { img: hero2, eyebrow: "For the growers", title: "Small farms, deep roots.", body: "Technical assistance, training, and community for small and limited-resource farmers across the Black Belt.", to: "/programs/small-farm", cta: "See how we help" },
  { img: hero3, eyebrow: "For the next generation", title: "Future leaders, planted today.", body: "The 2FAS pipeline is preparing students for careers across agriculture, research, and policy.", to: "/programs/2fas", cta: "Meet 2FAS" },
];

export function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    const id = setInterval(() => emblaApi.scrollNext(), 6000);
    return () => { clearInterval(id); emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <section className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((s, i) => (
            <div key={i} className="relative min-w-0 flex-[0_0_100%]">
              <div className="relative h-[560px] w-full overflow-hidden sm:h-[640px] md:h-[720px]">
                <img src={s.img} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority={i === 0 ? "high" : "auto"} loading={i === 0 ? "eager" : "lazy"} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(122,12,22,0.55) 55%, rgba(122,12,22,0.85) 100%)" }} />
                <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-16 pt-24 text-white sm:px-8 sm:pb-20 md:pb-24">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85">
                    <span className="grad-gold-text">{s.eyebrow}</span>
                  </div>
                  <h1 className="max-w-3xl text-[38px] font-black leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
                    {s.title}
                  </h1>
                  <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">{s.body}</p>
                  <div className="mt-7">
                    <Link
                      to={s.to}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-primary shadow-lg transition hover:scale-[1.02]"
                    >
                      {s.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center gap-1.5 sm:bottom-6">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`pointer-events-auto h-1.5 rounded-full transition-all ${i === selected ? "w-8 bg-white" : "w-1.5 bg-white/50"}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
