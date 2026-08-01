import { Link } from "@tanstack/react-router";
import { ArrowRight, Grid3X3 } from "lucide-react";
import { resourceHubLinks } from "@/lib/navigation";

export function HomeMoreSection() {
  return (
    <section
      aria-labelledby="more-title"
      className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)] sm:p-8"
    >
      <div className="flex items-end justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] institution-accent-text">
            JESUP directory
          </p>
          <h2 id="more-title" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            More
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Programs, publications, opportunities, tools, and services—all in one place.
          </p>
        </div>
        <span className="hidden h-12 w-12 place-items-center rounded-2xl bg-[var(--institution-accent-soft)] institution-accent-text sm:grid">
          <Grid3X3 className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-4 divide-y divide-border/60 sm:grid sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {resourceHubLinks.map((item, index) => (
          <Link
            key={item.to}
            to={item.to}
            className={`group flex min-h-20 items-center gap-4 px-1 py-4 transition hover:bg-secondary/40 sm:px-4 ${index % 2 === 0 ? "sm:pl-0" : "sm:pr-0"}`}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--institution-accent-soft)] institution-accent-text">
              <item.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-foreground">{item.title}</span>
              <span className="mt-1 block line-clamp-1 text-xs text-muted-foreground">
                {item.body}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-[var(--institution-accent-strong)]" />
          </Link>
        ))}
      </div>
    </section>
  );
}
