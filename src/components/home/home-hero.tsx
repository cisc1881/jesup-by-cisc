import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Network, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { HomeHeroSlide } from "@/lib/home";
import { useInstitutionTheme } from "@/components/institution-theme-provider";

type HomeHeroProps = { slides: HomeHeroSlide[] };

function welcomeLabel(email?: string | null) {
  if (!email) return "JESUP for the 1890 network";
  const name = email.split("@")[0]?.split(/[._-]/)[0];
  return name ? `Welcome, ${name.charAt(0).toUpperCase()}${name.slice(1)}` : "Welcome back";
}

export function HomeHero({ slides }: HomeHeroProps) {
  const { user } = useAuth();
  const { institutionName } = useInstitutionTheme();
  const featured = slides[0];

  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 grad-jesup text-white">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute -right-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-44 left-1/3 h-80 w-80 rounded-full bg-[var(--institution-accent)] opacity-20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.45) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto grid min-h-[470px] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.4fr_.6fr] lg:py-24">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--institution-accent)]">
            {welcomeLabel(user?.email)}
          </p>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
            One professional home for Extension, research, and major events.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
            Discover AEA, ARD, and 1890 Land-Grant opportunities, build your agenda, connect with
            peers, and manage the full conference experience through JESUP.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/events"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full institution-accent-bg px-6 text-sm font-extrabold shadow-lg transition hover:-translate-y-0.5 hover:brightness-105"
            >
              View agenda & events <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/join"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
            >
              Join the network <Users className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <aside
          className="rounded-[1.75rem] border border-white/15 bg-slate-950/25 p-5 shadow-2xl backdrop-blur-xl sm:p-6"
          aria-label="JESUP network highlights"
        >
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl institution-accent-bg">
              <Network className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                Your network
              </p>
              <p className="truncate text-sm font-extrabold text-white">
                {institutionName ?? "1890 Land-Grant Institutions"}
              </p>
            </div>
          </div>
          <div className="grid gap-3 py-5">
            <div className="flex items-center gap-3 text-sm text-white/80">
              <CalendarDays className="h-4 w-4 text-[var(--institution-accent)]" /> Personal agendas
              and live event access
            </div>
            <div className="flex items-center gap-3 text-sm text-white/80">
              <Users className="h-4 w-4 text-[var(--institution-accent)]" /> Attendee, speaker, and
              partner connections
            </div>
            <div className="flex items-center gap-3 text-sm text-white/80">
              <ShieldCheck className="h-4 w-4 text-[var(--institution-accent)]" /> Secure
              registration, check-in, and credentials
            </div>
          </div>
          {featured?.title ? (
            <Link
              to={featured.linkTo}
              {...(featured.linkParams ? { params: featured.linkParams } : {})}
              className="block rounded-2xl bg-white/10 p-4 transition hover:bg-white/15"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--institution-accent)]">
                Featured now
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-bold text-white">{featured.title}</p>
            </Link>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
