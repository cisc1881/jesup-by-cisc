import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, Home, Ticket, User, Users } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home, match: (path: string) => path === "/" },
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

  if (pathname.startsWith("/admin")) return null;

  const renderItem = (item: (typeof items)[number]) => {
    const active = item.match(pathname);
    return (
      <Link
        key={item.to}
        to={item.to}
        className="group flex min-h-[60px] min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold transition"
        aria-current={active ? "page" : undefined}
      >
        <item.icon
          className="h-5 w-5 text-primary"
          aria-hidden="true"
        />
        <span className={active ? "text-primary" : "text-muted-foreground"}>{item.label}</span>
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
          {items.slice(0, 2).map(renderItem)}
          <Link
            to="/me/wallet"
            className="group relative flex min-h-[60px] flex-col items-center justify-end gap-0.5 pb-1.5 text-[11px] font-bold text-primary"
            aria-current={pathname.startsWith("/me/wallet") ? "page" : undefined}
            aria-label="Tickets and wallet"
          >
            <span className="absolute -top-6 grid h-14 w-14 place-items-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-[var(--shadow-lift)] transition group-active:scale-95">
              <Ticket className="h-6 w-6" aria-hidden="true" />
            </span>
            <span>Tickets</span>
          </Link>
          {items.slice(2).map(renderItem)}
        </div>
      </nav>
    </>
  );
}
