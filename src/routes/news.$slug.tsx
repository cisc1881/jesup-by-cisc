import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public-layout";
import { PageContainer } from "@/components/design-system";
import {
  NewsDetailBody,
  NewsDetailHero,
  NewsRelatedSection,
} from "@/components/news";
import { articleJsonLd, buildPageHead } from "@/lib/seo";
import { fetchNewsBySlug } from "@/lib/news";

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ params }) => {
    const article = await fetchNewsBySlug(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return buildPageHead({ title: "Story not found", noindex: true });
    }
    const a = loaderData.article;
    return buildPageHead({
      title: a.seoTitle ?? a.title,
      description: a.seoDescription ?? a.summary ?? a.title,
      path: `/news/${a.slug}`,
      imageUrl: a.coverImageUrl,
      type: "article",
      jsonLd: articleJsonLd({
        title: a.title,
        description: a.seoDescription ?? a.summary,
        path: `/news/${a.slug}`,
        imageUrl: a.coverImageUrl,
        author: a.author,
        publishedAt: a.publishedAt,
      }),
    });
  },
  component: NewsDetailPage,
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-black tracking-tight">Story not found</h1>
        <Link to="/news" className="mt-6 inline-flex rounded-full grad-crimson px-5 py-2.5 text-sm font-bold text-white">
          Back to news
        </Link>
      </div>
    </PublicLayout>
  ),
});

function NewsDetailPage() {
  const { article } = Route.useLoaderData();

  return (
    <PublicLayout>
      <NewsDetailHero article={article} />
      <PageContainer size="md" className="space-y-10 pb-bottom-nav md:pb-[var(--page-py)]">
        <NewsDetailBody article={article} />
        <div className="gold-divider" />
        <div className="space-y-8">
          <NewsRelatedSection title="Related programs" items={article.programs} />
          <NewsRelatedSection title="Related events" items={article.events} />
          <NewsRelatedSection title="Related publications" items={article.publications} />
          <NewsRelatedSection title="Related partners" items={article.partners} />
        </div>
      </PageContainer>
    </PublicLayout>
  );
}
