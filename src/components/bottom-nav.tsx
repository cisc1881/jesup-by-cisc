import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Calendar, BookOpen, User } from "lucide-react";
import { isResourceRoute } from "@/lib/navigation";

const items = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { to: "/programs", label: "Programs", icon: LayoutGrid, match: (p: string) => p.startsWith("/programs") },
  { to: "/events", label: "Events", icon: Calendar, match: (p: string) => p.startsWith("/events") },
  { to: "/resources", label: "Resources", icon: BookOpen, match: isResourceRoute },
  { to: "/me", label: "Profile", icon: User, match: (p: string) => p.startsWith("/me") || p.startsWith("/auth") },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-lg md:hidden safe-bottom" aria-label="Primary">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1.5">
        {items.map((it) => {
          const active = it.match(pathname);
          return (
            <Link
              key={it.to}
              to={it.to}
              className="group flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition"
              aria-current={active ? "page" : undefined}
            >
              <span className={`grid h-9 w-9 place-items-center rounded-full transition ${active ? "grad-crimson text-white shadow-[var(--shadow-crimson)]" : "text-muted-foreground group-hover:text-primary"}`}>
                <it.icon className="h-[18px] w-[18px]" />
              </span>
              <span className={active ? "text-primary" : "text-muted-foreground"}>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
