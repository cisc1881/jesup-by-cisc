import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Mail, Search, Sparkles, User as UserIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { desktopNavLinks } from "@/lib/navigation";
import { JesupLogoMark } from "@/components/branding";
import { useInstitutionTheme } from "@/components/institution-theme-provider";
import { fetchNotifications } from "@/modules/notifications";
import { landGrant1890Logo } from "@/lib/land-grant-1890";
import { HeaderWeather } from "@/components/weather/header-weather";
import { ThemeToggle } from "@/components/design-system/theme-toggle";

export function PublicNav() {
  const { user, isAdmin } = useAuth();
  const { institutionName, institutionSlug, isGuest } = useInstitutionTheme();
  const institutionLogo = institutionSlug ? landGrant1890Logo(institutionSlug) : null;
  const navigate = useNavigate();
  const { data: messageUpdates = [] } = useQuery({
    queryKey: ["header-message-count", user?.id],
    enabled: !!user,
    queryFn: () => fetchNotifications({ userId: user!.id, audience: "user", limit: 100 }),
    refetchInterval: 30_000,
  });
  const unreadMessages = messageUpdates.filter((item) => !item.isRead).length;

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/85 backdrop-blur-xl after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[var(--gradient-jesup)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-1 px-4 sm:gap-6 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center" aria-label="JESUP home">
          <JesupLogoMark
            size="sm"
            tone="on-light"
            className="items-start"
            imageClassName="h-9 max-w-20 min-[375px]:max-w-[6.5rem] sm:max-w-[9rem]"
          />
        </Link>

        <Link
          to={user ? "/me" : "/partners"}
          className="hidden max-w-[17rem] items-center gap-2 rounded-full border border-border/70 bg-secondary/65 px-3 py-1.5 text-xs font-semibold text-foreground lg:flex"
          title={institutionName ?? "1890 Land-Grant Network"}
        >
          {institutionLogo ? (
            <img
              src={institutionLogo}
              alt=""
              className="h-6 w-6 shrink-0 rounded bg-white object-contain p-0.5"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          ) : (
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          )}
          <span className="truncate">{institutionName ?? "1890 Land-Grant Network"}</span>
        </Link>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {user && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative rounded-none"
              aria-label={`Messages${unreadMessages ? `, ${unreadMessages} unread` : ""}`}
            >
              <Link to="/me/messages">
                <Mail className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-black text-destructive-foreground">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </Link>
            </Button>
          )}
          <HeaderWeather />
          <ThemeToggle />
          <Button
            asChild
            variant="outline"
            size="icon"
            className="hidden rounded-none sm:inline-flex"
            aria-label="Search JESUP"
          >
            <Link to="/search">
              <Search className="h-4 w-4" />
            </Link>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden gap-2 rounded-none border-border/70 sm:inline-flex"
                  aria-label="Open account menu"
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden max-w-[140px] truncate sm:inline">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/ask">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Ask JESUP
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/me">My Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/me/notifications">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">JESUP Command Center</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              size="sm"
              className="rounded-full grad-jesup text-primary-foreground shadow-[var(--shadow-crimson)] hover:opacity-95"
            >
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
      <div className="hidden border-t border-border/50 bg-card/90 md:block">
        <nav
          className="mx-auto flex h-12 max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6"
          aria-label="Main navigation"
        >
          <Link
            to="/"
            className="shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold text-foreground transition hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            activeOptions={{ exact: true }}
            activeProps={{
              className: "bg-primary text-primary-foreground",
            }}
          >
            Home
          </Link>
          {desktopNavLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold text-foreground transition hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              activeProps={{
                className: "bg-primary text-primary-foreground",
              }}
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/me"
              className="ml-auto shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold text-foreground/70 transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-primary" }}
            >
              My Profile
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
