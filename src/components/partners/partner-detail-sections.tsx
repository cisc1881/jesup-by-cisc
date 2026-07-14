import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import type { PartnerAttachment, PartnerDetail, PartnerSocialLinks } from "@/lib/partners";
import { AppBadge, AppButton, SectionHeader } from "@/components/design-system";
import { fmtDateTime } from "@/lib/format";
import { PARTNERSHIP_FOCUS_AREAS } from "@/lib/partner-focus-areas";

export function PartnerDetailHero({ partner }: { partner: PartnerDetail }) {
  return (
    <section className="border-b border-border/60 bg-card">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-10 text-center sm:px-6 sm:py-14">
        <Link
          to="/partners"
          className="self-start rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80"
        >
          All partners
        </Link>
        <div className="grid h-32 w-full max-w-xs place-items-center rounded-3xl bg-secondary/70 p-6 sm:h-40">
          {partner.logoUrl ? (
            <img src={partner.logoUrl} alt={`${partner.name} logo`} className="max-h-24 max-w-full object-contain" />
          ) : (
            <span className="text-2xl font-black text-muted-foreground">{partner.name}</span>
          )}
        </div>
        <div>
          {partner.category && <AppBadge variant="gold">{partner.category}</AppBadge>}
          <h1 className="mt-3 text-3xl font-black tracking-[var(--tracking-tight)] text-foreground sm:text-4xl">
            {partner.name}
          </h1>
        </div>
      </div>
    </section>
  );
}

export function PartnerDetailBody({ partner }: { partner: PartnerDetail }) {
  return (
    <div className="space-y-8">
      {partner.description && (
        <section>
          <SectionHeader title="Overview" />
          <p className="mt-3 text-base leading-relaxed text-foreground/85">{partner.description}</p>
        </section>
      )}
      {partner.mission && (
        <section>
          <SectionHeader title="Mission" />
          <p className="mt-3 text-base leading-relaxed text-foreground/85">{partner.mission}</p>
        </section>
      )}
      {partner.partnershipAreas.length > 0 && (
        <section>
          <SectionHeader title="Partnership focus" />
          <div className="mt-3 flex flex-wrap gap-2">
            {partner.partnershipAreas.map((area) => (
              <AppBadge key={area} variant="outline">
                {area}
              </AppBadge>
            ))}
          </div>
        </section>
      )}
      <PartnerContactBlock partner={partner} />
      <PartnerSocialLinks links={partner.socialLinks} />
    </div>
  );
}

function PartnerContactBlock({ partner }: { partner: PartnerDetail }) {
  const hasContact = partner.websiteUrl || partner.email || partner.phone || partner.address;
  if (!hasContact) return null;

  return (
    <section>
      <SectionHeader title="Contact" />
      <div className="mt-3 space-y-2 text-sm text-foreground/85">
        {partner.websiteUrl && (
          <a
            href={partner.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            {partner.websiteUrl.replace(/^https?:\/\//, "")}
          </a>
        )}
        {partner.email && (
          <a href={`mailto:${partner.email}`} className="flex items-center gap-2 hover:text-primary">
            <Mail className="h-4 w-4" />
            {partner.email}
          </a>
        )}
        {partner.phone && (
          <a href={`tel:${partner.phone}`} className="flex items-center gap-2 hover:text-primary">
            <Phone className="h-4 w-4" />
            {partner.phone}
          </a>
        )}
        {partner.address && (
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            {partner.address}
          </p>
        )}
      </div>
    </section>
  );
}

function PartnerSocialLinks({ links }: { links: PartnerSocialLinks }) {
  const entries = Object.entries(links).filter(([, url]) => url);
  if (entries.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Social" />
      <div className="mt-3 flex flex-wrap gap-2">
        {entries.map(([network, url]) => (
          <AppButton key={network} variant="outline" size="sm" shape="pill" asChild>
            <a href={url!} target="_blank" rel="noreferrer" className="capitalize">
              {network}
            </a>
          </AppButton>
        ))}
      </div>
    </section>
  );
}

export function PartnerRelatedSection({
  title,
  items,
}: {
  title: string;
  items: PartnerAttachment[];
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <SectionHeader title={title} />
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={item.href}
              params={item.hrefParams}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition hover:border-primary/20 hover:shadow-token-soft"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{item.title}</p>
                {item.subtitle && (
                  <p className="truncate text-xs text-muted-foreground">{fmtDateTime(item.subtitle)}</p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PartnerDetailCta() {
  return (
    <div className="rounded-3xl grad-crimson p-6 text-center text-primary-foreground shadow-token-crimson sm:p-8">
      <h2 className="text-xl font-black tracking-[var(--tracking-tight)] sm:text-2xl">
        Partner with CISC
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-primary-foreground/85">
        Join our network of universities, agencies, foundations, and community organizations advancing sustainable
        development across the Black Belt.
      </p>
      <AppButton variant="inverse" size="lg" shape="pill" className="mt-5" asChild>
        <a href="mailto:info@cisc1881.org?subject=Become%20a%20JESUP%20Partner">Become a Partner</a>
      </AppButton>
    </div>
  );
}

export { PARTNERSHIP_FOCUS_AREAS };
