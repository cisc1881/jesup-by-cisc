import { Link } from "@tanstack/react-router";
import type { EventAttachment, EventDetail } from "@/lib/events";
import { AppBadge, AppCard, SectionHeader } from "@/components/design-system";
import { fmtDateTime } from "@/lib/format";
import { Calendar, MapPin } from "lucide-react";

type EventDetailHeroProps = {
  event: EventDetail;
};

export function EventDetailHero({ event }: EventDetailHeroProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl shadow-token-crimson">
      <div className="relative min-h-[320px] w-full overflow-hidden bg-secondary sm:min-h-[420px]">
        {event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grad-crimson" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(122,12,22,0.5) 55%, rgba(122,12,22,0.95) 100%)",
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

function RelatedList({ title, items, sectionId }: { title: string; items: EventAttachment[]; sectionId: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={sectionId} className="space-y-4">
      <SectionHeader title={title} titleId={sectionId} />
      <div className="gold-divider" />
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <AppCard key={item.id} variant="elevated" padding="sm" className="transition hover:shadow-token-lift">
            {item.hrefParams ? (
              <Link to={item.href} params={item.hrefParams} className="block">
                <div className="font-bold text-foreground">{item.title}</div>
                {item.subtitle && <div className="mt-1 text-sm text-muted-foreground">{item.subtitle}</div>}
              </Link>
            ) : (
              <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="block">
                <div className="font-bold text-foreground">{item.title}</div>
                {item.subtitle && <div className="mt-1 text-sm text-muted-foreground">{item.subtitle}</div>}
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
  return (
    <section aria-labelledby="event-agenda-heading" className="space-y-4">
      <SectionHeader title="Agenda" titleId="event-agenda-heading" />
      <div className="gold-divider" />
      <div className="space-y-3">
        {event.sessions.map((session) => (
          <AppCard key={session.id} variant="elevated" padding="md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-foreground">{session.title}</h3>
                {session.description && <p className="mt-2 text-sm text-muted-foreground">{session.description}</p>}
                {session.location && <p className="mt-2 text-sm text-muted-foreground">{session.location}</p>}
              </div>
              {session.startsAt && (
                <div className="text-sm font-semibold text-primary">{fmtDateTime(session.startsAt)}</div>
              )}
            </div>
          </AppCard>
        ))}
      </div>
    </section>
  );
}

export function EventSpeakers({ event }: { event: EventDetail }) {
  if (event.speakers.length === 0) return null;
  return (
    <section aria-labelledby="event-speakers-heading" className="space-y-4">
      <SectionHeader title="Speakers" titleId="event-speakers-heading" />
      <div className="gold-divider" />
      <div className="grid gap-4 sm:grid-cols-2">
        {event.speakers.map((speaker) => (
          <AppCard key={speaker.id} variant="elevated" padding="md" className="flex gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-secondary">
              {speaker.photoUrl ? <img src={speaker.photoUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full grad-crimson" />}
            </div>
            <div>
              <h3 className="font-bold text-foreground">{speaker.name}</h3>
              {speaker.title && <p className="text-sm text-primary">{speaker.title}</p>}
              {speaker.bio && <p className="mt-2 text-sm text-muted-foreground line-clamp-4">{speaker.bio}</p>}
            </div>
          </AppCard>
        ))}
      </div>
    </section>
  );
}

export function EventGallery({ event }: { event: EventDetail }) {
  if (event.gallery.length === 0) return null;
  return (
    <section aria-labelledby="event-gallery-heading" className="space-y-4">
      <SectionHeader title="Gallery" titleId="event-gallery-heading" />
      <div className="gold-divider" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {event.gallery.map((image) => (
          <figure key={image.id} className="overflow-hidden rounded-2xl shadow-token-soft">
            <img src={image.imageUrl} alt={image.caption ?? ""} className="aspect-[4/3] w-full object-cover" loading="lazy" />
            {image.caption && <figcaption className="px-3 py-2 text-sm text-muted-foreground">{image.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}

export function EventRelatedSections({ event }: { event: EventDetail }) {
  return (
    <div className="space-y-10">
      <RelatedList title="Related Programs" items={event.programs} sectionId="event-programs-heading" />
      <RelatedList title="Related Publications" items={event.publications} sectionId="event-publications-heading" />
      <RelatedList title="Related Podcasts" items={event.podcasts} sectionId="event-podcasts-heading" />
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
        <div className="prose prose-sm max-w-none text-foreground/90" dangerouslySetInnerHTML={{ __html: event.descriptionHtml }} />
      ) : (
        <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{event.description}</p>
      )}
    </section>
  );
}
