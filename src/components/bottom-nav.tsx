import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Compass, Home, User, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const items = [
  { to: "/", label: "Home", icon: Home, match: (path: string) => path === "/" },
  {
    to: "/events",
    label: "Agenda",
    icon: CalendarDays,
    match: (path: string) => path.startsWith("/events") || path.startsWith("/workshops"),
  },
  {
    to: "/explore",
    label: "Explore",
    icon: Compass,
    match: (path: string) =>
      path.startsWith("/explore") ||
      path.startsWith("/programs") ||
      path.startsWith("/resources") ||
      path.startsWith("/publications"),
  },
  {
    to: "/join",
    label: "Connect",
    icon: Users,
    match: (path: string) => path.startsWith("/join") || path.startsWith("/partners"),
  },
  {
    to: "/me",
    label: "Me",
    icon: User,
    match: (path: string) => path.startsWith("/me") || path.startsWith("/auth"),
  },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user } = useAuth();

  if (pathname.startsWith("/admin")) return null;

  const renderItem = (item: (typeof items)[number]) => {
    const active = item.match(pathname);
    return (
      <Link
        key={item.to}
        to={item.to}
        search={item.to === "/events" ? { view: user ? "mine" : "explore" } : undefined}
        className="group flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold transition"
        aria-current={active ? "page" : undefined}
      >
        <item.icon
          className={`h-5 w-5 ${active ? "institution-accent-text" : "text-muted-foreground group-hover:text-foreground"}`}
          aria-hidden="true"
        />
        <span className={active ? "institution-accent-text" : "text-muted-foreground"}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/98 backdrop-blur-lg md:hidden safe-bottom"
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-xl grid-cols-5 items-end px-1 pt-1">
          {items.map(renderItem)}
        </div>
      </nav>
    </>
  );
}
