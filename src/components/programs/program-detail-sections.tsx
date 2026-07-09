import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, Mail, Phone, User } from "lucide-react";
import type { ProgramAttachment, ProgramDetail } from "@/lib/programs";
import { fmtDateTime } from "@/lib/format";
import {
  AppCard,
  HorizontalScroll,
  HorizontalScrollItem,
  SectionHeader,
} from "@/components/design-system";
import { RichTextContent } from "@/components/rich-text-editor";
import { ProgramCtaBar } from "@/components/programs/program-cta-actions";

export function ProgramDetailHero({ program }: { program: ProgramDetail }) {
  return (
    <section className="relative">
      <div className="relative min-h-[360px] w-full overflow-hidden bg-secondary sm:min-h-[480px]">
        {program.coverImageUrl ? (
          <img src={program.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
        ) : (
          <div className="absolute inset-0 grad-crimson" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(122,12,22,0.6) 60%, rgba(122,12,22,0.92) 100%)",
          }}
        />
        <div className="relative z-10 mx-auto flex min-h-[360px] max-w-7xl flex-col justify-end px-5 pb-10 sm:min-h-[480px] sm:px-8 sm:pb-14">
          <Link
            to="/programs"
            className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/25"
          >
            All programs
          </Link>
          <div className="flex items-end gap-4">
            {program.logoUrl && (
              <img
                src={program.logoUrl}
                alt=""
                className="hidden h-20 w-20 rounded-2xl border border-white/20 bg-white/10 object-contain p-2 backdrop-blur sm:block"
              />
            )}
            <div className="min-w-0 flex-1">
              {program.categoryName && (
                <span className="rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                  {program.categoryName}
                </span>
              )}
              {program.short && (
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] grad-gold-text">
                  {program.short}
                </div>
              )}
              <h1 className="mt-2 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
                {program.name}
              </h1>
              {program.tagline && <p className="mt-3 max-w-2xl text-lg text-white/90">{program.tagline}</p>}
              <ProgramCtaBar program={program} onDark className="mt-6" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProgramContactCard({ program }: { program: ProgramDetail }) {
  const hasContact =
    program.programDirector ||
    program.contactPerson ||
    program.contactEmail ||
    program.contactPhone ||
    program.websiteUrl;

  if (!hasContact) return null;

  return (
    <AppCard variant="lift" padding="md" className="space-y-3">
      <SectionHeader title="Contact" titleClassName="text-xl sm:text-2xl" />
      {program.programDirector && (
        <div className="flex items-start gap-3 text-sm">
          <User className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <div className="font-semibold text-foreground">Program director</div>
            <div className="text-muted-foreground">{program.programDirector}</div>
          </div>
        </div>
      )}
      {program.contactPerson && (
        <div className="flex items-start gap-3 text-sm">
          <User className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <div className="font-semibold text-foreground">Contact</div>
            <div className="text-muted-foreground">{program.contactPerson}</div>
          </div>
        </div>
      )}
      {program.contactEmail && (
        <a href={`mailto:${program.contactEmail}`} className="flex items-center gap-3 text-sm text-primary hover:underline">
          <Mail className="h-4 w-4 shrink-0" />
          {program.contactEmail}
        </a>
      )}
      {program.contactPhone && (
        <a href={`tel:${program.contactPhone}`} className="flex items-center gap-3 text-sm text-primary hover:underline">
          <Phone className="h-4 w-4 shrink-0" />
          {program.contactPhone}
        </a>
      )}
      {program.websiteUrl && (
        <a
          href={program.websiteUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          Visit website <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </AppCard>
  );
}

export function ProgramGallery({ images }: { images: ProgramDetail["gallery"] }) {
  if (images.length === 0) return null;
  return (
    <section>
      <SectionHeader title="Gallery" titleClassName="text-xl sm:text-2xl" />
      <HorizontalScroll>
        {images.map((image) => (
          <HorizontalScrollItem key={image.id ?? image.imageUrl}>
            <figure className="w-[75vw] overflow-hidden rounded-2xl bg-card shadow-token-soft sm:w-80">
              <img src={image.imageUrl} alt={image.caption ?? ""} className="aspect-[4/3] w-full object-cover" loading="lazy" />
              {image.caption && (
                <figcaption className="px-4 py-2 text-sm text-muted-foreground">{image.caption}</figcaption>
              )}
            </figure>
          </HorizontalScrollItem>
        ))}
      </HorizontalScroll>
    </section>
  );
}

export function ProgramRelatedSection({
  title,
  items,
}: {
  title: string;
  items: ProgramAttachment[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <SectionHeader title={title} titleClassName="text-xl sm:text-2xl" />
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const isExternal = item.href.startsWith("http");
          const content = (
            <>
              <div className="min-w-0">
                <div className="truncate font-bold text-foreground">{item.title}</div>
                {item.subtitle && (
                  <div className="truncate text-sm text-muted-foreground">
                    {item.href === "/events/$id" ? fmtDateTime(item.subtitle) : item.subtitle}
                  </div>
                )}
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </>
          );

          if (isExternal) {
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between rounded-2xl bg-card p-4 shadow-token-soft transition hover:shadow-token-lift"
              >
                {content}
              </a>
            );
          }

          return (
            <Link
              key={item.id}
              to={item.href}
              params={item.hrefParams}
              className="group flex items-center justify-between rounded-2xl bg-card p-4 shadow-token-soft transition hover:shadow-token-lift"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function ProgramContentSections({ program }: { program: ProgramDetail }) {
  return (
    <div className="space-y-10">
      {program.descriptionHtml && (
        <section>
          <SectionHeader title="About this program" titleClassName="text-xl sm:text-2xl" />
          <RichTextContent html={program.descriptionHtml} className="text-base sm:text-lg" />
        </section>
      )}
      {program.objectivesHtml && (
        <section>
          <SectionHeader title="Objectives" titleClassName="text-xl sm:text-2xl" />
          <RichTextContent html={program.objectivesHtml} />
        </section>
      )}
      <ProgramGallery images={program.gallery} />
      <ProgramRelatedSection title="Related events" items={program.events} />
      <ProgramRelatedSection title="Publications" items={program.publications} />
      <ProgramRelatedSection title="Podcast episodes" items={program.podcasts} />
      <ProgramRelatedSection title="Partners" items={program.partners} />
      <ProgramRelatedSection title="Grants" items={program.grants} />
    </div>
  );
}
