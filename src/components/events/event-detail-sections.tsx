import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { EventAttachment, EventDetail, EventSpeaker, EventSpeakerSession } from "@/lib/events";
import { galleryImageAlt } from "@/lib/event-gallery";
import { AppBadge, AppCard, SectionHeader } from "@/components/design-system";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/format";
import { Calendar, ChevronRight, Globe, Link2, Mail, MapPin, Phone } from "lucide-react";
import { EventAgendaNotice } from "./event-agenda-notice";
import { isDraftAgenda } from "@/lib/event-agenda-status";
import { formatInTimeZone } from "date-fns-tz";

type EventDetailHeroProps = {
  event: EventDetail;
};

export function EventDetailHero({ event }: EventDetailHeroProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl shadow-token-crimson">
      <div className="relative min-h-[320px] w-full overflow-hidden bg-secondary sm:min-h-[420px]">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={event.slug === "fc135" ? { objectPosition: "center 25%" } : undefined}
          />
        ) : (
          <div className="absolute inset-0 grad-crimson" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(8,8,8,.45) 42%, rgba(8,8,8,.95) 100%)",
          }}
        />
        <div className="relative z-10 flex min-h-[320px] flex-col justify-end p-6 sm:min-h-[420px] sm:p-10">
          {event.categoryName && (
            <AppBadge variant="gold" className="w-fit">
              {event.categoryName}
            </AppBadge>
          )}
          <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-[var(--tracking-tight)] text-white sm:text-5xl">
            {event.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-white/90">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              {fmtDateTime(event.startsAt)}
              {event.endsAt ? ` – ${fmtDateTime(event.endsAt)}` : ""}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
                {event.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function RelatedList({
  title,
  items,
  sectionId,
}: {
  title: string;
  items: EventAttachment[];
  sectionId: string;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={sectionId} className="space-y-4">
      <SectionHeader title={title} titleId={sectionId} />
      <div className="gold-divider" />
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <AppCard
            key={item.id}
            variant="elevated"
            padding="sm"
            className="transition hover:shadow-token-lift"
          >
            {item.hrefParams ? (
              <Link to={item.href} params={item.hrefParams} className="block">
                <div className="font-bold text-foreground">{item.title}</div>
                {item.subtitle && (
                  <div className="mt-1 text-sm text-muted-foreground">{item.subtitle}</div>
                )}
              </Link>
            ) : (
              <a
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="block"
              >
                <div className="font-bold text-foreground">{item.title}</div>
                {item.subtitle && (
                  <div className="mt-1 text-sm text-muted-foreground">{item.subtitle}</div>
                )}
              </a>
            )}
          </AppCard>
        ))}
      </div>
    </section>
  );
}

export function EventAgenda({ event }: { event: EventDetail }) {
  if (event.sessions.length === 0) return null;
  const timezone = event.timezone || "America/Chicago";
  const provisional = isDraftAgenda(event.metadata);
  const days = new Map<string, typeof event.sessions>();
  for (const session of event.sessions) {
    const day = session.startsAt ? formatInTimeZone(session.startsAt, timezone, "yyyy-MM-dd") : "unscheduled";
    days.set(day, [...(days.get(day) ?? []), session]);
  }
  return (
    <section aria-labelledby="event-agenda-heading" className="space-y-4">
      <SectionHeader title={provisional ? "Provisional agenda" : "Agenda"} titleId="event-agenda-heading" />
      <div className="gold-divider" />
      <EventAgendaNotice metadata={event.metadata} />
      <p className="text-sm text-muted-foreground">Times shown in {timezone.replaceAll("_", " ")}.{provisional ? " Proposed times, topics and parallel tracks remain subject to organizer review. Speakers and hosts are unassigned unless explicitly confirmed." : ""}</p>
      {[...days.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([day,sessions])=><div key={day} className="space-y-3">
        <h3 className="border-b py-3 text-lg font-semibold">{day === "unscheduled" ? "Time to be assigned" : formatInTimeZone(`${day}T12:00:00Z`, "UTC", "EEEE, MMMM d, yyyy")}</h3>
        {sessions.map((session) => (
          <AppCard key={session.id} variant="elevated" padding="md">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-foreground">{session.title}</h4>
                {session.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{session.description}</p>
                )}
                {session.location && (
                  <p className="mt-2 text-sm text-muted-foreground">{session.location}</p>
                )}
              </div>
              {session.startsAt && (
                <div className="text-sm font-semibold text-primary">
                  {provisional && <span className="mr-1">Proposed ·</span>}{formatInTimeZone(session.startsAt,timezone,"h:mm a")}{session.endsAt ? `–${formatInTimeZone(session.endsAt,timezone,"h:mm a")}` : ""}
                </div>
              )}
            </div>
          </AppCard>
        ))}
      </div>)}
    </section>
  );
}

function SpeakerPhoto({ speaker, className }: { speaker: EventSpeaker; className: string }) {
  return (
    <div className={`shrink-0 overflow-hidden rounded-2xl bg-secondary ${className}`}>
      {speaker.photoUrl ? (
        <img src={speaker.photoUrl} alt={`Portrait of ${speaker.name}`} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full grad-crimson" />
      )}
    </div>
  );
}

function speakerSessionTime(session: EventSpeakerSession, timezone: string): string | null {
  if (!session.startsAt) return null;
  const start = formatInTimeZone(session.startsAt, timezone, "EEE, MMM d · h:mm a");
  return session.endsAt
    ? `${start}–${formatInTimeZone(session.endsAt, timezone, "h:mm a")}`
    : start;
}

function SpeakerDetailDialog({
  speaker,
  timezone,
  onClose,
}: {
  speaker: EventSpeaker | null;
  timezone: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={speaker != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        {speaker && (
          <div className="space-y-5">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <SpeakerPhoto speaker={speaker} className="h-20 w-20" />
                <div>
                  {speaker.isKeynote && (
                    <AppBadge variant="gold" className="mb-1 w-fit">Keynote</AppBadge>
                  )}
                  <DialogTitle className="text-xl">{speaker.name}</DialogTitle>
                  {speaker.title && <p className="mt-1 text-sm text-primary">{speaker.title}</p>}
                </div>
              </div>
            </DialogHeader>
            {speaker.bio && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {speaker.bio}
              </p>
            )}
            {speaker.sessions.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Sessions
                </h3>
                <ul className="mt-2 space-y-2">
                  {speaker.sessions.map((session) => (
                    <li key={session.id} className="rounded-xl border border-border/60 px-3 py-2">
                      <div className="text-sm font-semibold text-foreground">{session.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {speakerSessionTime(session, timezone) ?? "Time to be announced"}
                        {session.location ? ` · ${session.location}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(speaker.websiteUrl ||
              speaker.socialLinks.length > 0 ||
              speaker.contactEmail ||
              speaker.contactPhone) && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Follow up
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {speaker.websiteUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={speaker.websiteUrl} target="_blank" rel="noreferrer">
                        <Globe className="h-4 w-4" /> Website
                      </a>
                    </Button>
                  )}
                  {speaker.socialLinks.map((link) => (
                    <Button key={`${link.platform}-${link.url}`} variant="outline" size="sm" asChild>
                      <a href={link.url} target="_blank" rel="noreferrer">
                        <Link2 className="h-4 w-4" /> {link.label}
                      </a>
                    </Button>
                  ))}
                  {speaker.contactEmail && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${speaker.contactEmail}`}>
                        <Mail className="h-4 w-4" /> Email
                      </a>
                    </Button>
                  )}
                  {speaker.contactPhone && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${speaker.contactPhone.replace(/[^0-9+]/g, "")}`}>
                        <Phone className="h-4 w-4" /> {speaker.contactPhone}
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function EventSpeakers({ event }: { event: EventDetail }) {
  const [activeSpeaker, setActiveSpeaker] = useState<EventSpeaker | null>(null);
  if (event.speakers.length === 0) return null;
  const timezone = event.timezone || "America/Chicago";
  const keynotes = event.speakers.filter((s) => s.isKeynote);
  const others = event.speakers.filter((s) => !s.isKeynote);

  return (
    <section aria-labelledby="event-speakers-heading" className="space-y-4">
      <SectionHeader title="Speakers" titleId="event-speakers-heading" />
      <div className="gold-divider" />

      {keynotes.length > 0 && (
        <div className="grid gap-4">
          {keynotes.map((speaker) => (
            <AppCard key={speaker.id} variant="elevated" padding="lg" className="border-accent/40">
              <button
                type="button"
                onClick={() => setActiveSpeaker(speaker)}
                className="flex w-full flex-col gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:flex-row sm:items-center"
              >
                <SpeakerPhoto speaker={speaker} className="h-28 w-28 sm:h-32 sm:w-32" />
                <div className="min-w-0">
                  <AppBadge variant="gold" className="w-fit">Keynote speaker</AppBadge>
                  <h3 className="mt-2 font-serif text-2xl font-bold text-foreground">{speaker.name}</h3>
                  {speaker.title && <p className="mt-1 text-sm font-semibold text-primary">{speaker.title}</p>}
                  {speaker.bio && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{speaker.bio}</p>
                  )}
                  {speaker.sessions.length > 0 && (
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">
                      {speaker.sessions.map((s) => s.title).join(" · ")}
                    </p>
                  )}
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Read full bio <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            </AppCard>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {others.map((speaker) => (
            <AppCard key={speaker.id} variant="elevated" padding="md">
              <button
                type="button"
                onClick={() => setActiveSpeaker(speaker)}
                className="flex w-full gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <SpeakerPhoto speaker={speaker} className="h-16 w-16" />
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground">{speaker.name}</h3>
                  {speaker.title && <p className="text-sm text-primary">{speaker.title}</p>}
                  {speaker.bio && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{speaker.bio}</p>
                  )}
                  {speaker.sessions.length > 0 && (
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">
                      {speaker.sessions.map((s) => s.title).join(" · ")}
                    </p>
                  )}
                </div>
              </button>
            </AppCard>
          ))}
        </div>
      )}

      <SpeakerDetailDialog
        speaker={activeSpeaker}
        timezone={timezone}
        onClose={() => setActiveSpeaker(null)}
      />
    </section>
  );
}

export function EventGallery({ event }: { event: EventDetail }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  if (event.gallery.length === 0) return null;

  const activeImage = activeIndex != null ? event.gallery[activeIndex] : null;

  return (
    <section aria-labelledby="event-gallery-heading" className="space-y-4">
      <SectionHeader title="Gallery" titleId="event-gallery-heading" />
      <div className="gold-divider" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {event.gallery.map((image, index) => (
          <figure key={image.id} className="overflow-hidden rounded-2xl shadow-token-soft">
            <button
              type="button"
              className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setActiveIndex(index)}
              aria-label={`View larger: ${galleryImageAlt(image)}`}
            >
              <img
                src={image.imageUrl}
                alt={galleryImageAlt(image)}
                className="aspect-[4/3] w-full object-cover transition hover:opacity-95"
                loading={index < 3 ? "eager" : "lazy"}
              />
            </button>
            {image.caption && (
              <figcaption className="px-3 py-2 text-sm text-muted-foreground">
                {image.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <Dialog open={activeIndex != null} onOpenChange={(open) => !open && setActiveIndex(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{activeImage?.caption || "Event photo"}</DialogTitle>
          </DialogHeader>
          {activeImage && (
            <img
              src={activeImage.imageUrl}
              alt={galleryImageAlt(activeImage)}
              className="max-h-[75vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function EventRelatedSections({ event }: { event: EventDetail }) {
  return (
    <div className="space-y-10">
      <RelatedList
        title="Related Programs"
        items={event.programs}
        sectionId="event-programs-heading"
      />
      <RelatedList
        title="Related Publications"
        items={event.publications}
        sectionId="event-publications-heading"
      />
      <RelatedList
        title="Related Podcasts"
        items={event.podcasts}
        sectionId="event-podcasts-heading"
      />
      <RelatedList title="Partners" items={event.partners} sectionId="event-partners-heading" />
      <RelatedList title="Sponsors" items={event.sponsors} sectionId="event-sponsors-heading" />
    </div>
  );
}

export function EventDescription({ event }: { event: EventDetail }) {
  if (!event.descriptionHtml && !event.description) return null;
  return (
    <section aria-labelledby="event-description-heading" className="space-y-4">
      <SectionHeader title="About this event" titleId="event-description-heading" />
      <div className="gold-divider" />
      {event.descriptionHtml ? (
        <div
          className="prose prose-sm max-w-none text-foreground/90"
          dangerouslySetInnerHTML={{ __html: event.descriptionHtml }}
        />
      ) : (
        <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
          {event.description}
        </p>
      )}
    </section>
  );
}
