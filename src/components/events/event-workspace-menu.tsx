import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import {
  Accessibility,
  CalendarCheck2,
  Car,
  ClipboardCheck,
  ContactRound,
  DoorOpen,
  HelpCircle,
  Map,
  Menu,
  MessageCircle,
  QrCode,
  Soup,
  TicketCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { listEventMealDays } from "@/lib/meals";
import type { EventDetail } from "@/lib/events";

type Registration =
  | { id: string; status: string; ticket_code: string | null; checked_in_at: string | null }
  | null
  | undefined;

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function EventWorkspaceMenu({
  event,
  registration,
  userId,
  userEmail,
}: {
  event: EventDetail;
  registration: Registration;
  userId?: string;
  userEmail?: string;
}) {
  const [qrMode, setQrMode] = useState<"ticket" | "contact" | null>(null);
  const { data: profile } = useQuery({
    queryKey: ["event-network-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, phone, affiliation")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: mealDays = [] } = useQuery({
    queryKey: ["attendee-meal-days", event.id],
    enabled: !!registration,
    queryFn: () => listEventMealDays(event.id),
  });
  const contactCard = `MECARD:N:${profile?.full_name ?? "JESUP attendee"};EMAIL:${profile?.email ?? userEmail ?? ""};TEL:${profile?.phone ?? ""};ORG:${profile?.affiliation ?? ""};;`;
  const parkingUrl =
    typeof event.metadata.parking_url === "string" ? event.metadata.parking_url : null;
  const tourUrl = typeof event.metadata.tour_url === "string" ? event.metadata.tour_url : null;
  const actions = [
    {
      label: registration ? "My registration" : "Registration",
      icon: TicketCheck,
      section: "event-registration",
    },
    {
      label: "My event QR code",
      icon: QrCode,
      action: () => setQrMode("ticket"),
      disabled: !registration?.ticket_code,
    },
    { label: "Session attendance", icon: ClipboardCheck, section: "event-agenda" },
    {
      label: `Meal tickets${mealDays.length ? ` (${mealDays.length})` : ""}`,
      icon: Soup,
      section: "event-meals",
    },
    {
      label: "Swap contact information",
      icon: ContactRound,
      action: () => setQrMode("contact"),
      disabled: !userId,
    },
    {
      label: "Tour of event",
      icon: Map,
      href: tourUrl,
      section: tourUrl ? undefined : "event-map",
    },
    { label: "Sessions & rooms", icon: DoorOpen, section: "event-agenda" },
    { label: "Agenda", icon: CalendarCheck2, section: "event-agenda" },
    {
      label: "Parking",
      icon: Car,
      href: parkingUrl,
      section: parkingUrl ? undefined : "event-map",
    },
    { label: "Attendee chat", icon: MessageCircle, section: "event-chat" },
    { label: "Accommodation & accessibility", icon: Accessibility, section: "event-registration" },
  ];

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" className="rounded-full shadow-sm">
            <Menu className="h-4 w-4" /> Event menu
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[88vw] overflow-y-auto p-0 sm:max-w-sm">
          <div className="institution-accent-bg px-6 pb-6 pt-10">
            <SheetHeader>
              <SheetTitle className="text-left text-xl">{event.title}</SheetTitle>
              <SheetDescription className="text-left text-current/75">
                {registration ? "Your attendee workspace" : "Event information and registration"}
              </SheetDescription>
            </SheetHeader>
          </div>
          <nav className="divide-y divide-border/70" aria-label="Event workspace">
            {actions.map((item) => {
              const Icon = item.icon;
              const content = (
                <span className="flex min-h-14 w-full items-center gap-4 px-5 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-muted/60">
                  <Icon className="h-5 w-5 shrink-0 institution-accent-text" />
                  <span className="flex-1">{item.label}</span>
                </span>
              );
              if (item.href)
                return (
                  <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                    {content}
                  </a>
                );
              return (
                <SheetClose asChild key={item.label}>
                  <button
                    type="button"
                    className="w-full disabled:opacity-40"
                    disabled={item.disabled}
                    onClick={() =>
                      item.action ? item.action() : item.section && scrollToSection(item.section)
                    }
                  >
                    {content}
                  </button>
                </SheetClose>
              );
            })}
            <SheetClose asChild>
              <Link
                to="/ask"
                className="flex min-h-14 items-center gap-4 px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted/60"
              >
                <HelpCircle className="h-5 w-5 institution-accent-text" /> Ask JESUP
              </Link>
            </SheetClose>
          </nav>
        </SheetContent>
      </Sheet>
      <Dialog open={qrMode !== null} onOpenChange={(open) => !open && setQrMode(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>
              {qrMode === "ticket" ? "Event admission QR" : "Networking QR"}
            </DialogTitle>
            <DialogDescription>
              {qrMode === "ticket"
                ? "Present this code for event, session, and meal validation."
                : "Let another attendee scan this code to save your contact details."}
            </DialogDescription>
          </DialogHeader>
          <div className="mx-auto rounded-3xl bg-white p-5 shadow-sm">
            <QRCodeSVG
              value={qrMode === "ticket" ? (registration?.ticket_code ?? "") : contactCard}
              size={220}
              level="M"
              marginSize={1}
            />
          </div>
          <p className="font-mono text-sm font-bold text-foreground">
            {qrMode === "ticket" ? registration?.ticket_code : (profile?.full_name ?? userEmail)}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
