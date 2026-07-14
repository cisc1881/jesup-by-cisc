import type { ReactNode } from "react";
import { PublicNav } from "./public-nav";
import { BottomNav } from "./bottom-nav";
import { SkipLink } from "./skip-link";
import { Link } from "@tanstack/react-router";
import ciscLogo from "@/assets/cisc-logo.png.asset.json";
import { JesupLogoMark } from "@/components/branding";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SkipLink />
      <PublicNav />
      <div className="flex flex-1 flex-col pb-bottom-nav md:pb-0">
        <main id="main-content" className="flex-1 outline-none">
          {children}
        </main>
        <footer className="mt-8 border-t border-border/60 bg-card">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex shrink-0 flex-col items-start gap-3">
                <JesupLogoMark
                  size="md"
                  tone="on-light"
                  className="items-start"
                  imageClassName="h-12 max-w-[10rem]"
                />
                <img
                  src={ciscLogo.url}
                  alt="Carver Integrative Sustainability Center"
                  className="h-10 w-auto rounded-md"
                  loading="lazy"
                />
              </div>
              <div className="text-xs leading-relaxed text-muted-foreground">
                <div className="text-sm font-black tracking-tight text-foreground">
                  The Digital Extension Wagon
                </div>
                <div className="mt-1">Powered by the Carver Integrative Sustainability Center</div>
                <div>A Center of Excellence · Tuskegee University Cooperative Extension</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <Link to="/join" className="hover:text-primary">
                Join / Connect
              </Link>
              <Link to="/programs" className="hover:text-primary">
                Programs
              </Link>
              <Link to="/events" className="hover:text-primary">
                Events
              </Link>
              <Link to="/podcasts" className="hover:text-primary">
                Podcasts
              </Link>
              <Link to="/partners" className="hover:text-primary">
                Partners
              </Link>
              <Link to="/donate" className="hover:text-primary">
                Donate
              </Link>
            </div>
          </div>
        </footer>
      </div>
      <BottomNav />
    </div>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-b border-border/50 bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            {eyebrow && (
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] grad-gold-text">
                {eyebrow}
              </div>
            )}
            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] grad-gold-text">
            {eyebrow}
          </div>
        )}
        <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}
