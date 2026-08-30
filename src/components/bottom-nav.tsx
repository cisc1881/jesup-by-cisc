import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Home, LayoutGrid, QrCode, User } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { to: "/", label: "Home", icon: Home, match: (path: string) => path === "/" },
  {
    to: "/events",
    label: "Events",
    icon: CalendarDays,
    match: (path: string) => path.startsWith("/events") || path.startsWith("/workshops"),
  },
  {
    to: "/programs",
    label: "Programs",
    icon: LayoutGrid,
    match: (path: string) => path.startsWith("/programs") || path.startsWith("/resources"),
  },
  {
    to: "/me",
    label: "My JESUP",
    icon: User,
    match: (path: string) => path.startsWith("/me") || path.startsWith("/auth"),
  },
] as const;

type QrTicket = { ticketCode: string; eventTitle: string };

export function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [qrOpen, setQrOpen] = useState(false);
  const { data: ticket } = useQuery({
    queryKey: ["bottom-nav-qr-ticket", user?.id],
    enabled: !!user && qrOpen,
    queryFn: async (): Promise<QrTicket | null> => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("ticket_code, created_at, events(title, starts_at)")
        .eq("user_id", user!.id)
        .neq("status", "cancelled")
        .not("ticket_code", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data?.ticket_code || !data.events) return null;
      const event = data.events as unknown as { title: string };
      return { ticketCode: data.ticket_code, eventTitle: event.title };
    },
  });

  if (pathname.startsWith("/admin")) return null;

  function openQr() {
    if (!user) {
      void navigate({ to: "/auth", search: { next: "/me" } });
      return;
    }
    setQrOpen(true);
  }

  const renderItem = (item: (typeof items)[number]) => {
    const active = item.match(pathname);
    return (
      <Link
        key={item.to}
        to={item.to}
        className="group flex min-h-[54px] min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[9px] font-semibold transition sm:text-[10px]"
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
          {items.slice(0, 2).map(renderItem)}
          <button
            type="button"
            onClick={openQr}
            className="group relative flex min-h-[62px] flex-col items-center justify-end gap-0.5 pb-1.5 text-[9px] font-black institution-accent-text sm:text-[10px]"
            aria-label="Open my JESUP QR code"
          >
            <span className="absolute -top-7 grid h-16 w-16 place-items-center rounded-full border-[5px] border-card institution-accent-bg shadow-[var(--shadow-lift)] transition group-active:scale-95">
              <QrCode className="h-8 w-8" aria-hidden="true" />
            </span>
            <span>My QR</span>
          </button>
          {items.slice(2).map(renderItem)}
        </div>
      </nav>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm rounded-none border-t-4 border-t-[var(--institution-accent)]">
          <DialogHeader>
            <DialogTitle>My JESUP QR</DialogTitle>
            <DialogDescription>
              Present this code at event check-in. Your newest active registration is shown.
            </DialogDescription>
          </DialogHeader>
          {ticket ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-fit bg-white p-4">
                <QRCodeSVG value={ticket.ticketCode} size={220} level="M" marginSize={1} />
              </div>
              <div>
                <p className="font-bold text-foreground">{ticket.eventTitle}</p>
                <p className="mt-1 break-all font-mono text-sm text-muted-foreground">
                  {ticket.ticketCode}
                </p>
              </div>
              <Link
                to="/me"
                onClick={() => setQrOpen(false)}
                className="inline-flex min-h-11 items-center justify-center px-5 text-sm font-bold institution-accent-bg"
              >
                View all registrations
              </Link>
            </div>
          ) : (
            <div className="border-y border-border py-8 text-center">
              <QrCode className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-bold text-foreground">No active ticket yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Register for an event to receive a check-in QR code.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
