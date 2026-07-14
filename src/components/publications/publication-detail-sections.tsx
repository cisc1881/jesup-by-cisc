import { Link } from "@tanstack/react-router";
import { ArrowRight, Download, ExternalLink } from "lucide-react";
import type { PublicationAttachment, PublicationDetail } from "@/lib/publications";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { AppBadge, AppButton, SectionHeader } from "@/components/design-system";

export function PublicationDetailHero({ publication }: { publication: PublicationDetail }) {
  return (
    <section className="relative">
      <div className="relative min-h-[280px] overflow-hidden bg-secondary sm:min-h-[360px]">
        {publication.coverImageUrl ? (
          <img src={publication.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grad-crimson" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="relative z-10 mx-auto max-w-4xl px-5 pb-10 pt-8 sm:px-8 sm:pb-12">
          <Link
            to="/publications"
            className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/25"
          >
            All publications
          </Link>
          <div className="flex flex-wrap gap-2">
            {publication.contentTypeLabel && (
              <AppBadge variant="secondary">{publication.contentTypeLabel}</AppBadge>
            )}
            {publication.categoryName && <AppBadge variant="gold">{publication.categoryName}</AppBadge>}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">{publication.title}</h1>
          {publication.author && <p className="mt-3 text-sm text-white/85 sm:text-base">By {publication.author}</p>}
          {publication.publishedAt && (
            <p className="mt-2 text-sm text-white/70">Published {fmtDate(publication.publishedAt)}</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function PublicationActionBar({ publication }: { publication: PublicationDetail }) {
  if (!publication.fileUrl && !publication.externalUrl) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {publication.fileUrl && (
        <AppButton variant="primary" size="lg" shape="pill" asChild>
          <a href={publication.fileUrl} target="_blank" rel="noreferrer">
            <Download className="h-4 w-4" /> Download
          </a>
        </AppButton>
      )}
      {publication.externalUrl && (
        <AppButton variant="outline" size="lg" shape="pill" asChild>
          <a href={publication.externalUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> Open resource
          </a>
        </AppButton>
      )}
    </div>
  );
}

export function PublicationTagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <AppBadge key={tag} variant="outline">
          {tag}
        </AppBadge>
      ))}
    </div>
  );
}

export function PublicationRelatedSection({
  title,
  items,
}: {
  title: string;
  items: PublicationAttachment[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <SectionHeader title={title} titleClassName="text-xl sm:text-2xl" />
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            params={item.hrefParams}
            className="group flex items-center justify-between rounded-2xl bg-card p-4 shadow-token-soft transition hover:shadow-token-lift"
          >
            <div className="min-w-0">
              <div className="truncate font-bold text-foreground">{item.title}</div>
              {item.subtitle && (
                <div className="truncate text-sm text-muted-foreground">
                  {item.href === "/events/$id" ? fmtDateTime(item.subtitle) : item.subtitle}
                </div>
              )}
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </section>
  );
}
