import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import {
  PartnerDetailBody,
  PartnerDetailCta,
  PartnerDetailHero,
  PartnerRelatedSection,
} from "@/components/partners";
import { fetchPartnerBySlug } from "@/lib/partners";
import { buildPageHead, organizationJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/partners/$slug")({
  loader: async ({ params }) => {
    const partner = await fetchPartnerBySlug(params.slug);
    if (!partner) throw notFound();
    return { partner };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return buildPageHead({ title: "Partner not found", noindex: true });
    }
    const p = loaderData.partner;
    return buildPageHead({
      title: `${p.name} · Strategic Partners`,
      description: p.shortDescription ?? p.description ?? p.name,
      path: `/partners/${p.slug}`,
      imageUrl: p.logoUrl,
      jsonLd: organizationJsonLd({
        name: p.name,
        description: p.shortDescription ?? p.description,
        path: `/partners/${p.slug}`,
        imageUrl: p.logoUrl,
        url: p.websiteUrl,
      }),
    });
  },
  component: PartnerDetailPage,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-black tracking-tight">Partner not found</h1>
        <Link to="/partners" className="mt-6 inline-flex rounded-full grad-crimson px-5 py-2.5 text-sm font-bold text-white">
          Back to partners
        </Link>
      </div>
    </PublicLayout>
  ),
});

function PartnerDetailPage() {
  const { partner } = Route.useLoaderData();

  return (
    <PublicLayout>
      <PartnerDetailHero partner={partner} />
      <PageContainer size="md" className="space-y-10 pb-bottom-nav md:pb-[var(--page-py)]">
        <PartnerDetailBody partner={partner} />
        <div className="gold-divider" />
        <div className="space-y-8">
          <PartnerRelatedSection title="Related programs" items={partner.programs} />
          <PartnerRelatedSection title="Related events" items={partner.events} />
          <PartnerRelatedSection title="Related publications" items={partner.publications} />
          <PartnerRelatedSection title="Related podcasts" items={partner.podcasts} />
        </div>
        <PartnerDetailCta />
      </PageContainer>
    </PublicLayout>
  );
}
