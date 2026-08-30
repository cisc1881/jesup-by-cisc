import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { PublicNav } from "./public-nav";
import { BottomNav } from "./bottom-nav";
import { SkipLink } from "./skip-link";
import { Link } from "@tanstack/react-router";
import { FloatingUtilityDock } from "@/components/floating-utility-dock";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-background">
      <SkipLink />
      <PublicNav />
      <div className="flex min-w-0 flex-1 flex-col pb-bottom-nav md:pb-0">
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {children}
        </main>
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="fixed bottom-24 left-0 z-30 inline-flex min-h-11 items-center gap-2 border border-l-0 border-border bg-card px-3 text-xs font-bold text-muted-foreground shadow-sm md:bottom-6"
              aria-label="Open JESUP information and policies"
            >
              <Info className="h-4 w-4" /> Information
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[90vw] overflow-y-auto sm:max-w-md">
            <SheetHeader className="pr-8">
              <SheetTitle>JESUP information</SheetTitle>
              <SheetDescription>
                The 1890 Digital Extension Network, powered by the Carver Integrative Sustainability
                Center.
              </SheetDescription>
            </SheetHeader>
            <nav className="my-6 grid divide-y border-y text-sm font-bold">
              <Link to="/join" className="px-1 py-3 hover:text-primary">
                Join / Connect
              </Link>
              <Link to="/programs" className="px-1 py-3 hover:text-primary">
                Programs
              </Link>
              <Link to="/events" className="px-1 py-3 hover:text-primary">
                Events
              </Link>
              <Link to="/podcasts" className="px-1 py-3 hover:text-primary">
                Podcasts
              </Link>
              <Link to="/partners" className="px-1 py-3 hover:text-primary">
                Partners
              </Link>
              <Link to="/donate" className="px-1 py-3 hover:text-primary">
                Donate
              </Link>
              <Link to="/privacy" className="px-1 py-3 hover:text-primary">
                Privacy
              </Link>
              <Link to="/terms" className="px-1 py-3 hover:text-primary">
                Terms
              </Link>
            </nav>
            <div className="border-t pt-5">
              <h2 className="text-sm font-black">Equal opportunity and accommodation</h2>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                It is the policy of Tuskegee University Cooperative Extension Program to provide
                equal employment opportunities and to offer educational programs, resources and
                materials to eligible participants without regard to race, color, national origin,
                religion, sexual orientation, disability, age, marital or veteran status, political
                beliefs, or reprisal or retaliation for prior civil rights activity, in any program
                or activity conducted or funded by USDA (not all bases apply to all programs). For
                all reasonable accommodation requests, please contact Shirley Brown, Director,
                Office of Civil Rights Compliance at{" "}
                <a
                  href="mailto:sbrown@tuskegee.edu"
                  className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                >
                  sbrown@tuskegee.edu
                </a>
                .
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <FloatingUtilityDock />
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
