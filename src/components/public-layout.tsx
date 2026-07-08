import type { ReactNode } from "react";
import { PublicNav } from "./public-nav";
import { Link } from "@tanstack/react-router";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-secondary/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-serif text-base font-bold text-primary">CISC Connect</div>
            <div>Center for Integrated and Sustainable Communities · Tuskegee University</div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/markets" className="hover:text-primary">Markets</Link>
            <Link to="/events" className="hover:text-primary">Events</Link>
            <Link to="/publications" className="hover:text-primary">Publications</Link>
            <Link to="/grants" className="hover:text-primary">Grants</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="border-b bg-gradient-to-b from-secondary/60 to-background">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="gold-bar mb-3" />
            <h1 className="font-serif text-3xl font-bold text-primary sm:text-4xl">{title}</h1>
            {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      </div>
    </div>
  );
}
