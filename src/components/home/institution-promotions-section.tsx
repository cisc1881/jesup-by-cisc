import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { HomeHeroSlide } from "@/lib/home";

export function InstitutionPromotionsSection({ slides }: { slides: HomeHeroSlide[] }) {
  const promotions = slides.filter((slide) => !!slide.imageUrl).slice(0, 3);
  if (promotions.length === 0) return null;

  return (
    <section aria-labelledby="institution-promotions-heading">
      <div className="mb-4">
        <p className="text-eyebrow institution-accent-text">Featured opportunities</p>
        <h2 id="institution-promotions-heading" className="text-2xl font-black tracking-tight">
          Recommended for your network
        </h2>
      </div>
      <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
        {promotions.map((slide) => (
          <Link
            key={slide.id}
            to={slide.linkTo}
            {...(slide.linkParams ? { params: slide.linkParams } : {})}
            className="group relative min-h-64 overflow-hidden bg-card"
          >
            <img
              src={slide.imageUrl}
              alt={slide.imageAlt}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/75">
                Featured
              </p>
              <h3 className="mt-2 line-clamp-2 text-xl font-black leading-tight">{slide.title}</h3>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold">
                {slide.linkLabel || "Learn more"} <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
