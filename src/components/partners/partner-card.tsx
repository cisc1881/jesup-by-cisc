import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import type { PartnerListItem } from "@/lib/partners";
import { partnerCardDescription } from "@/lib/partners";
import { AppBadge, AppButton, AppCard } from "@/components/design-system";
import { cn } from "@/lib/utils";

type PartnerCardProps = {
  partner: PartnerListItem;
  className?: string;
};

export function PartnerCard({ partner, className }: PartnerCardProps) {
  const description = partnerCardDescription(partner);

  return (
    <AppCard variant="lift" padding="md" className={cn("flex h-full flex-col", className)}>
      <div className="grid h-24 place-items-center overflow-hidden rounded-2xl bg-secondary/60">
        {partner.logoUrl ? (
          <img
            src={partner.logoUrl}
            alt={`${partner.name} logo`}
            className="max-h-16 max-w-[85%] object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-lg font-black text-muted-foreground">
            {partner.name
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex flex-wrap gap-2">
          {partner.category && <AppBadge variant="gold">{partner.category}</AppBadge>}
          {partner.isFeatured && <AppBadge variant="secondary">Featured</AppBadge>}
        </div>
        <h3 className="mt-2 text-lg font-black tracking-[var(--tracking-tight)] text-foreground line-clamp-2">
          {partner.name}
        </h3>
        {description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {partner.websiteUrl && (
            <AppButton variant="outline" size="sm" shape="pill" asChild>
              <a href={partner.websiteUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="h-3.5 w-3.5" />
                Website
              </a>
            </AppButton>
          )}
          <AppButton variant="primary" size="sm" shape="pill" asChild>
            <Link to="/partners/$slug" params={{ slug: partner.slug }}>
              View Profile
            </Link>
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
}
