import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const links = [
  { to: "/programs", label: "Programs" },
  { to: "/events", label: "Events" },
  { to: "/podcast", label: "Podcast" },
  { to: "/resources", label: "Resources" },
  { to: "/partners", label: "Partners" },
  { to: "/donate", label: "Donate" },
] as const;

export function PublicNav() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl grad-crimson text-white text-[13px] font-black tracking-tight shadow-[var(--shadow-crimson)]">J</span>
          <div className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-[15px] font-black tracking-tight text-foreground">JESUP</span>
            <span className="hidden truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:inline">Digital Extension Wagon</span>
          </div>
        </Link>

        <nav className="ml-2 hidden items-center gap-0.5 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3.5 py-2 text-[13px] font-semibold text-foreground/70 transition hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-primary bg-secondary" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-full border-border/70">
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden max-w-[140px] truncate sm:inline">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/me">My Profile</Link></DropdownMenuItem>
                {isAdmin && <DropdownMenuItem asChild><Link to="/admin">Admin Dashboard</Link></DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="rounded-full grad-crimson text-white shadow-[var(--shadow-crimson)] hover:opacity-95">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
