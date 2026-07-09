import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import {
  PublicationActionBar,
  PublicationDetailHero,
  PublicationRelatedSection,
  PublicationTagList,
} from "@/components/publications";
import { fetchPublicationBySlug } from "@/lib/publications";

export const Route = createFileRoute("/publications/$slug")({
  loader: async ({ params }) => {
    const publication = await fetchPublicationBySlug(params.slug);
    if (!publication) throw notFound();
    return { publication };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Publication not found · JESUP" }, { name: "robots", content: "noindex" }] };
    const p = loaderData.publication;
    return {
      meta: [
        { title: `${p.title} · JESUP` },
        { name: "description", content: p.description ?? p.title },
        { property: "og:title", content: `${p.title} · JESUP` },
        { property: "og:description", content: p.description ?? p.title },
        ...(p.coverImageUrl ? [{ property: "og:image", content: p.coverImageUrl }] : []),
      ],
    };
  },
  component: PublicationDetailPage,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-black tracking-tight">Publication not found</h1>
        <Link to="/publications" className="mt-6 inline-flex rounded-full grad-crimson px-5 py-2.5 text-sm font-bold text-white">
          Back to publications
        </Link>
      </div>
    </PublicLayout>
  ),
});

function PublicationDetailPage() {
  const { publication } = Route.useLoaderData();

  return (
    <PublicLayout>
      <PublicationDetailHero publication={publication} />
      <PageContainer size="md" className="space-y-8 pb-bottom-nav md:pb-[var(--page-py)]">
        <PublicationActionBar publication={publication} />
        {publication.description && (
          <p className="text-base leading-relaxed text-foreground/85 sm:text-lg">{publication.description}</p>
        )}
        <PublicationTagList tags={publication.tags} />
        <div className="gold-divider" />
        <div className="space-y-8">
          <PublicationRelatedSection title="Related programs" items={publication.programs} />
          <PublicationRelatedSection title="Related events" items={publication.events} />
          <PublicationRelatedSection title="Related podcast episodes" items={publication.podcasts} />
        </div>
      </PageContainer>
    </PublicLayout>
  );
}
