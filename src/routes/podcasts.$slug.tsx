import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import {
  PodcastDetailBody,
  PodcastDetailHero,
  PodcastRelatedSection,
} from "@/components/podcasts";
import { fetchPodcastBySlug } from "@/lib/podcasts";

export const Route = createFileRoute("/podcasts/$slug")({
  loader: async ({ params }) => {
    const episode = await fetchPodcastBySlug(params.slug);
    if (!episode) throw notFound();
    return { episode };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Episode not found · JESUP" }, { name: "robots", content: "noindex" }] };
    const ep = loaderData.episode;
    return {
      meta: [
        { title: `${ep.title} · JESUP Podcast` },
        { name: "description", content: ep.description ?? ep.title },
        { property: "og:title", content: `${ep.title} · JESUP Podcast` },
        { property: "og:description", content: ep.description ?? ep.title },
        ...(ep.coverUrl ? [{ property: "og:image", content: ep.coverUrl }] : []),
      ],
    };
  },
  component: PodcastDetailPage,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-black tracking-tight">Episode not found</h1>
        <Link to="/podcasts" className="mt-6 inline-flex rounded-full grad-crimson px-5 py-2.5 text-sm font-bold text-white">
          Back to podcasts
        </Link>
      </div>
    </PublicLayout>
  ),
});

function PodcastDetailPage() {
  const { episode } = Route.useLoaderData();

  return (
    <PublicLayout>
      <PodcastDetailHero episode={episode} />
      <PageContainer size="md" className="space-y-8 pb-bottom-nav md:pb-[var(--page-py)]">
        <PodcastDetailBody episode={episode} />
        <div className="gold-divider" />
        <div className="space-y-8">
          <PodcastRelatedSection title="Related programs" items={episode.programs} />
          <PodcastRelatedSection title="Related events" items={episode.events} />
          <PodcastRelatedSection title="Related publications" items={episode.publications} />
        </div>
      </PageContainer>
    </PublicLayout>
  );
}
