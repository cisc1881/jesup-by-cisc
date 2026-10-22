import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JesupLogoMark } from "@/components/branding/jesup-logo-mark";
import { eventDateLabel } from "@/lib/conference";
import type { EventDetail } from "@/lib/events";

export function ConferenceHero({ event, entry = false }: { event: EventDetail; entry?: boolean }) {
  return (
    <header className="conference-masthead px-5 py-8 sm:px-10 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-current/25 pb-5">
        <JesupLogoMark tone="on-light" size="md" />
        <span className="text-sm font-semibold">{typeof event.metadata.brand_label === "string" && event.metadata.brand_label.trim() ? event.metadata.brand_label : event.slug === "fc135" ? "Tuskegee University · CISC" : "JESUP by CISC"}</span>
      </div>
      <div className="max-w-4xl py-8 sm:py-12">
        <p className="mb-4 text-sm font-semibold text-accent">{event.slug === "fc135" ? "FC135 · February 2027" : "Conference"}</p>
        <h1 className="text-4xl font-bold sm:text-5xl">{event.title}</h1>
        <p className="mt-5 max-w-2xl text-xl leading-relaxed text-accent">{String(event.metadata.conference_theme ?? event.description ?? "")}</p>
        <div className="mt-7 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-6">
          <span className="inline-flex items-center gap-2"><CalendarDays className="size-4 shrink-0" />{eventDateLabel(event)}</span>
          <span className="inline-flex items-center gap-2"><MapPin className="size-4 shrink-0" />{event.location}</span>
        </div>
        {entry && <Button variant="secondary" className="mt-8" asChild><Link to="/events/$id" params={{ id: event.slug }}>{event.slug === "fc135" ? "Explore FC135" : "Explore conference"} <ArrowUpRight className="size-4" /></Link></Button>}
      </div>
      <div className="flex flex-wrap justify-between gap-2 border-t border-current/25 pt-4 text-xs">
        <span>{event.title}</span><span>{eventDateLabel(event)}</span>
      </div>
    </header>
  );
}