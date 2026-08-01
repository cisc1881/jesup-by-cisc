import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, Presentation, LayoutGrid, Library, User } from "lucide-react";
import { isResourceRoute } from "@/lib/navigation";

const items = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  {
    to: "/events",
    label: "Events",
    icon: CalendarDays,
    match: (p: string) => p.startsWith("/events"),
  },
  {
    to: "/workshops",
    label: "Workshops",
    icon: Presentation,
    match: (p: string) => p.startsWith("/workshops"),
  },
  {
    to: "/programs",
    label: "Programs",
    icon: LayoutGrid,
    match: (p: string) => p.startsWith("/programs"),
  },
  {
    to: "/resources",
    label: "Resources",
    icon: Library,
    match: (p: string) => isResourceRoute(p),
  },
  {
    to: "/me",
    label: "My JESUP",
    icon: User,
    match: (p: string) => p.startsWith("/me") || p.startsWith("/auth"),
  },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-lg md:hidden safe-bottom"
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-xl grid-cols-6 items-stretch px-1 pt-1.5">
        {items.map((it) => {
          const active = it.match(pathname);
          return (
            <Link
              key={it.to}
              to={it.to}
              className="group flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[9px] font-semibold transition sm:text-[10px]"
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-full transition ${active ? "institution-accent-bg shadow-[var(--shadow-soft)]" : "text-muted-foreground group-hover:text-primary"}`}
              >
                <it.icon className="h-[18px] w-[18px]" />
              </span>
              <span className={active ? "institution-accent-text" : "text-muted-foreground"}>
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
