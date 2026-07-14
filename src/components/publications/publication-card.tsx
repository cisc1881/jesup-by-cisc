import { Link } from "@tanstack/react-router";
import { Download, ExternalLink, Play } from "lucide-react";
import type { PublicationListItem } from "@/lib/publications";
import { AppBadge, AppButton, AppCard } from "@/components/design-system";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type PublicationCardProps = {
  publication: PublicationListItem;
  className?: string;
};

export function PublicationCard({ publication, className }: PublicationCardProps) {
  const isVideo = publication.contentType === "video";
  const isExternal = publication.contentType === "external_link";

  return (
    <AppCard variant="lift" padding="none" className={cn("flex h-full flex-col overflow-hidden", className)}>
      <Link to="/publications/$slug" params={{ slug: publication.slug }} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
          {publication.coverImageUrl ? (
            <img src={publication.coverImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center grad-crimson text-primary-foreground">
              {isVideo ? <Play className="h-10 w-10 opacity-80" /> : <span className="text-3xl font-black opacity-30">PDF</span>}
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap gap-2">
          {publication.contentTypeLabel && (
            <AppBadge variant="secondary">{publication.contentTypeLabel}</AppBadge>
          )}
          {publication.categoryName && <AppBadge variant="gold">{publication.categoryName}</AppBadge>}
        </div>
        <Link to="/publications/$slug" params={{ slug: publication.slug }}>
          <h3 className="line-clamp-2 text-lg font-bold text-foreground">{publication.title}</h3>
        </Link>
        {publication.description && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{publication.description}</p>
        )}
        {publication.publishedAt && (
          <p className="mt-2 text-xs font-medium text-muted-foreground">{fmtDate(publication.publishedAt)}</p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {publication.fileUrl && (
            <AppButton variant="primary" size="sm" shape="pill" asChild>
              <a href={publication.fileUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                <Download className="h-4 w-4" /> Download
              </a>
            </AppButton>
          )}
          {(publication.externalUrl || isExternal || isVideo) && publication.externalUrl && (
            <AppButton variant="outline" size="sm" shape="pill" asChild>
              <a href={publication.externalUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="h-4 w-4" /> {isVideo ? "Watch" : "View"}
              </a>
            </AppButton>
          )}
          {!publication.fileUrl && !publication.externalUrl && (
            <AppButton variant="outline" size="sm" shape="pill" asChild>
              <Link to="/publications/$slug" params={{ slug: publication.slug }}>
                Read more
              </Link>
            </AppButton>
          )}
        </div>
      </div>
    </AppCard>
  );
}
