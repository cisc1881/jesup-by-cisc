import { Link } from "@tanstack/react-router";
import type { MarketAttachment, MarketDetail, MarketProduct, MarketVendor } from "@/lib/markets";
import { DAY_LABELS, MARKET_PRODUCT_CATEGORY_LABELS, formatMarketAddress } from "@/lib/markets";
import { googleMapsDirectionsUrl } from "@/lib/market-geo";
import { AppBadge, AppButton, AppCard, HorizontalScroll, HorizontalScrollItem, SectionHeader } from "@/components/design-system";
import { MarketCard } from "@/components/markets/market-card";
import {
  Bell,
  Bookmark,
  Car,
  Clock,
  CreditCard,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MarketDetailHeroProps = {
  market: MarketDetail;
  saved?: boolean;
  onToggleSaved?: () => void;
  hasReminder?: boolean;
  onToggleReminder?: () => void;
  onShare?: () => void;
};

export function MarketDetailHero({
  market,
  saved,
  onToggleSaved,
  hasReminder,
  onToggleReminder,
  onShare,
}: MarketDetailHeroProps) {
  const address = formatMarketAddress(market);

  return (
    <section className="relative isolate overflow-hidden rounded-3xl shadow-token-crimson">
      <div className="relative min-h-[320px] w-full overflow-hidden bg-secondary sm:min-h-[420px]">
        {market.coverImageUrl ? (
          <img src={market.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
        <div className="absolute right-4 top-4 z-10 flex gap-2 sm:right-6 sm:top-6">
          {onToggleSaved && (
            <button
              type="button"
              onClick={onToggleSaved}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full glass-surface-dark transition",
                saved && "text-accent",
              )}
              aria-label={saved ? "Remove favorite" : "Favorite market"}
            >
              <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
            </button>
          )}
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="grid h-10 w-10 place-items-center rounded-full glass-surface-dark"
              aria-label="Share market"
            >
              <Share2 className="h-4 w-4 text-white" />
            </button>
          )}
        </div>
        <div className="relative z-10 flex min-h-[320px] flex-col justify-end p-6 sm:min-h-[420px] sm:p-10">
          <div className="flex flex-wrap gap-2">
            {market.isOpenToday && <AppBadge variant="gold">Open today</AppBadge>}
            {market.acceptsSnapEbt && <AppBadge variant="gold">SNAP/EBT</AppBadge>}
            {market.acceptsCredit && <AppBadge variant="outline">Credit cards</AppBadge>}
            {market.season && <AppBadge variant="outline">{market.season}</AppBadge>}
          </div>
          <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-[var(--tracking-tight)] text-white sm:text-5xl">
            {market.name}
          </h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-white/90">
            {address && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" />
                {address}
              </span>
            )}
            {market.hours && (
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                {market.hours}
              </span>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <AppButton variant="inverse" size="lg" shape="pill" asChild>
              <a href={googleMapsDirectionsUrl(market)} target="_blank" rel="noreferrer">
                <Navigation className="h-4 w-4" />
                Directions
              </a>
            </AppButton>
            {onToggleReminder && (
              <AppButton variant="outline" size="lg" shape="pill" className="border-white/30 text-white hover:bg-white/10" onClick={onToggleReminder}>
                <Bell className={cn("h-4 w-4", hasReminder && "fill-current")} />
                {hasReminder ? "Reminder set" : "Add reminder"}
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function MarketDescription({ market }: { market: MarketDetail }) {
  if (!market.description) return null;
  return (
    <section aria-labelledby="market-description-heading" className="space-y-4">
      <SectionHeader title="About this market" titleId="market-description-heading" />
      <div className="gold-divider" />
      <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{market.description}</p>
    </section>
  );
}

export function MarketHoursSection({ market }: { market: MarketDetail }) {
  if (market.structuredHours.length === 0 && !market.hours) return null;
  return (
    <section aria-labelledby="market-hours-heading" className="space-y-4">
      <SectionHeader title="Hours" titleId="market-hours-heading" />
      <div className="gold-divider" />
      {market.structuredHours.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {market.structuredHours.map((hour) => (
            <AppCard key={hour.dayOfWeek} variant="elevated" padding="sm" className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{DAY_LABELS[hour.dayOfWeek]}</span>
              <span className="text-sm text-muted-foreground">
                {hour.isClosed ? "Closed" : `${hour.opensAt?.slice(0, 5)} – ${hour.closesAt?.slice(0, 5)}`}
              </span>
            </AppCard>
          ))}
        </div>
      ) : (
        <p className="text-foreground/90">{market.hours}</p>
      )}
    </section>
  );
}

export function MarketContactSection({ market }: { market: MarketDetail }) {
  const hasContact = market.phone || market.email || market.websiteUrl || market.contactName;
  if (!hasContact) return null;
  return (
    <section aria-labelledby="market-contact-heading" className="space-y-4">
      <SectionHeader title="Contact" titleId="market-contact-heading" />
      <div className="gold-divider" />
      <div className="grid gap-3 sm:grid-cols-2">
        {market.contactName && (
          <AppCard variant="elevated" padding="md">
            <div className="text-sm text-muted-foreground">Contact</div>
            <div className="mt-1 font-bold text-foreground">{market.contactName}</div>
          </AppCard>
        )}
        {market.phone && (
          <AppCard variant="elevated" padding="md">
            <a href={`tel:${market.phone}`} className="flex items-center gap-2 font-semibold text-foreground">
              <Phone className="h-4 w-4 text-primary" />
              {market.phone}
            </a>
          </AppCard>
        )}
        {market.email && (
          <AppCard variant="elevated" padding="md">
            <a href={`mailto:${market.email}`} className="flex items-center gap-2 font-semibold text-foreground">
              <Mail className="h-4 w-4 text-primary" />
              {market.email}
            </a>
          </AppCard>
        )}
        {market.websiteUrl && (
          <AppCard variant="elevated" padding="md">
            <a href={market.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold text-foreground">
              <Globe className="h-4 w-4 text-primary" />
              Website <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </AppCard>
        )}
      </div>
    </section>
  );
}

export function MarketPaymentsSection({ market }: { market: MarketDetail }) {
  if (!market.acceptsSnapEbt && !market.acceptsCredit && !market.paymentNotes && !market.parkingInfo) return null;
  return (
    <section aria-labelledby="market-payments-heading" className="space-y-4">
      <SectionHeader title="Visit info" titleId="market-payments-heading" />
      <div className="gold-divider" />
      <div className="flex flex-wrap gap-2">
        {market.acceptsSnapEbt && <AppBadge variant="gold">SNAP/EBT accepted</AppBadge>}
        {market.acceptsCredit && <AppBadge variant="outline">Credit cards</AppBadge>}
      </div>
      {market.paymentNotes && (
        <AppCard variant="elevated" padding="md" className="flex gap-3">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">{market.paymentNotes}</p>
        </AppCard>
      )}
      {market.parkingInfo && (
        <AppCard variant="elevated" padding="md" className="flex gap-3">
          <Car className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">{market.parkingInfo}</p>
        </AppCard>
      )}
    </section>
  );
}

function ProductChip({ product }: { product: MarketProduct }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground">
      {product.name}
      <span className="text-muted-foreground">· {MARKET_PRODUCT_CATEGORY_LABELS[product.category]}</span>
      {product.availableToday && <AppBadge variant="gold" className="px-2 py-0 text-[10px]">Today</AppBadge>}
      {product.isOrganic && <span className="text-primary">Organic</span>}
      {product.isLocal && <span className="text-accent">Local</span>}
    </span>
  );
}

function VendorCard({ vendor }: { vendor: MarketVendor }) {
  return (
    <AppCard variant="elevated" padding="md" className="space-y-4">
      <div className="flex gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-secondary">
          {vendor.logoUrl ? (
            <img src={vendor.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center grad-crimson">
              <Sprout className="h-6 w-6 text-white/80" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-foreground">{vendor.name}</h3>
          {vendor.seasonalAvailability && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">{vendor.seasonalAvailability}</p>
          )}
          {vendor.description && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{vendor.description}</p>}
        </div>
      </div>
      {vendor.products.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {vendor.products.map((product) => (
            <ProductChip key={product.id ?? product.name} product={product} />
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {vendor.websiteUrl && (
          <AppButton variant="outline" size="sm" shape="pill" asChild>
            <a href={vendor.websiteUrl} target="_blank" rel="noreferrer">
              Website <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </AppButton>
        )}
        {vendor.socialUrl && (
          <AppButton variant="ghost" size="sm" shape="pill" asChild>
            <a href={vendor.socialUrl} target="_blank" rel="noreferrer">
              Social
            </a>
          </AppButton>
        )}
      </div>
    </AppCard>
  );
}

export function MarketVendorsSection({ market }: { market: MarketDetail }) {
  if (market.vendors.length === 0) return null;
  return (
    <section aria-labelledby="market-vendors-heading" className="space-y-4">
      <SectionHeader title="Vendors" titleId="market-vendors-heading" />
      <div className="gold-divider" />
      <div className="grid gap-4 sm:grid-cols-2">
        {market.vendors.map((vendor) => (
          <VendorCard key={vendor.id ?? vendor.name} vendor={vendor} />
        ))}
      </div>
    </section>
  );
}

export function MarketGallery({ market }: { market: MarketDetail }) {
  if (market.gallery.length === 0) return null;
  return (
    <section aria-labelledby="market-gallery-heading" className="space-y-4">
      <SectionHeader title="Photos" titleId="market-gallery-heading" />
      <div className="gold-divider" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {market.gallery.map((image) => (
          <figure key={image.id} className="overflow-hidden rounded-2xl shadow-token-soft">
            <img src={image.imageUrl} alt={image.caption ?? ""} className="aspect-[4/3] w-full object-cover" loading="lazy" />
            {image.caption && <figcaption className="px-3 py-2 text-sm text-muted-foreground">{image.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}

export function MarketAnnouncements({ market }: { market: MarketDetail }) {
  if (market.announcements.length === 0) return null;
  return (
    <section aria-labelledby="market-announcements-heading" className="space-y-4">
      <SectionHeader title="Announcements" titleId="market-announcements-heading" />
      <div className="gold-divider" />
      <div className="space-y-3">
        {market.announcements.map((announcement) => (
          <AppCard key={announcement.id} variant="elevated" padding="md">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-bold text-foreground">{announcement.title}</h3>
              <AppBadge variant={announcement.announcementType === "weather" ? "gold" : "outline"}>
                {announcement.announcementType}
              </AppBadge>
            </div>
            {announcement.body && <p className="mt-2 text-sm text-muted-foreground">{announcement.body}</p>}
          </AppCard>
        ))}
      </div>
    </section>
  );
}

function RelatedList({ title, items, sectionId }: { title: string; items: MarketAttachment[]; sectionId: string }) {
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

export function MarketRelatedSections({ market }: { market: MarketDetail }) {
  return (
    <div className="space-y-10">
      <RelatedList title="Upcoming events" items={market.events} sectionId="market-events-heading" />
      <RelatedList title="Programs hosted here" items={market.programs} sectionId="market-programs-heading" />
    </div>
  );
}

export function MarketNearbySection({ market }: { market: MarketDetail }) {
  if (market.nearbyMarkets.length === 0) return null;
  return (
    <section aria-labelledby="market-nearby-heading" className="space-y-5">
      <SectionHeader title="Nearby markets" titleId="market-nearby-heading" />
      <div className="gold-divider" />
      <HorizontalScroll gap="md">
        {market.nearbyMarkets.map((nearby) => (
          <HorizontalScrollItem key={nearby.id} width="md">
            <MarketCard market={nearby} className="w-[78vw] sm:w-72" />
          </HorizontalScrollItem>
        ))}
      </HorizontalScroll>
    </section>
  );
}
