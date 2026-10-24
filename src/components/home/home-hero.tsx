import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { HomeHeroSlide } from "@/lib/home";
import { cn } from "@/lib/utils";
import { AppButton } from "@/components/design-system";

type HomeHeroProps = { slides: HomeHeroSlide[] };

export const HOME_ROTATION_INTERVAL_MS = 7000;

export function HomeHero({ slides }: HomeHeroProps) {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [manualRevision, setManualRevision] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const safeSelected = slides.length > 0 ? selected % slides.length : 0;
  const active = slides[safeSelected];

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(preference.matches);
    const syncVisibility = () => setHidden(document.hidden);
    syncMotion();
    syncVisibility();
    preference.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => {
      preference.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || hovered || focused || hidden || reducedMotion) return;
    const timer = window.setTimeout(() => {
      setSelected((current) => (current + 1) % slides.length);
    }, HOME_ROTATION_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [selected, slides.length, hovered, focused, hidden, reducedMotion, manualRevision]);

  function selectSlide(index: number) {
    if (slides.length <= 1) return;
    setSelected(index);
    setManualRevision((current) => current + 1);
    setAnnouncement(`${slides[index]?.title ?? "JESUP"}, slide ${index + 1} of ${slides.length}`);
  }

  function changeSlide(direction: -1 | 1) {
    if (slides.length <= 1) return;
    selectSlide((safeSelected + direction + slides.length) % slides.length);
  }

  return (
    <section aria-label="JESUP highlights" aria-roledescription="carousel" className={cn("home-network-hero w-full text-home-foreground", active?.imageUrl && "home-hero-image")}
      onPointerEnter={(event) => { if (event.pointerType !== "touch") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    >
      <span className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
      {active?.imageUrl && (
        <img key={active.id} src={active.imageUrl} alt={active.imageAlt} className="home-hero-media" loading="eager" />
      )}
      <div className="home-hero-inner mx-auto max-w-7xl px-5 pb-6 pt-10 sm:px-8 sm:pt-14">
        <div className="home-slide-content home-hero-panel max-w-4xl" aria-live="off">
          <p className="text-xs font-semibold text-home-muted">
            JESUP / The Digital Extension Wagon
          </p>
          <h1 className="mt-5 text-3xl font-semibold sm:text-5xl">
            {active?.title ?? "JESUP"}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-home-muted sm:text-lg">
            {active?.subtitle ??
              "The Digital Extension Wagon. Knowledge, programs, and opportunity—connected."}
          </p>
          <div className="mt-7">
            <AppButton asChild variant="secondary" size="lg" shape="square" className="home-hero-cta whitespace-normal text-left">
            <Link
              to={active?.linkTo ?? "/events"}
              {...(active?.linkParams ? { params: active.linkParams } : {})}
            >
              {active?.linkLabel ?? "Explore events"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            </AppButton>
          </div>
        </div>
        {slides.length > 1 && (
          <div className="home-hero-controls mt-8 flex items-start gap-3 border-t border-home-muted/30 pt-4 sm:mt-10 sm:items-center">
            <div className="flex min-w-0 flex-1 gap-4 overflow-x-auto" role="group" aria-label="Featured item selection">
              {slides.map((slide, index) => (
                <AppButton
                  key={slide.id}
                  variant="ghost" shape="square"
                  type="button"
                  onClick={() => selectSlide(index)}
                  className={cn(
                    "home-slide-control min-h-11 shrink-0 px-0 text-sm",
                    index === safeSelected ? "border-b-2 border-home-foreground text-home-foreground" : "text-home-muted",
                  )}
                  aria-label={`Show ${slide.imageAlt}`}
                  aria-current={index === safeSelected ? "true" : undefined}
                ><span className="max-w-48 truncate">{slide.imageAlt}</span></AppButton>
              ))}
            </div>
            <div className="flex shrink-0 gap-1">
              <AppButton variant="ghost" size="icon" title="Previous featured item" aria-label="Previous featured item" onClick={() => changeSlide(-1)} className="home-slide-control text-home-foreground"><ArrowLeft /></AppButton>
              <AppButton variant="ghost" size="icon" title="Next featured item" aria-label="Next featured item" onClick={() => changeSlide(1)} className="home-slide-control text-home-foreground"><ArrowRight /></AppButton>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
