import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Copy, Facebook, Linkedin, Share2, Twitter, User } from "lucide-react";
import type { NewsAttachment, NewsDetail } from "@/lib/news";
import { AppBadge, AppButton, SectionHeader } from "@/components/design-system";
import { RichTextContent } from "@/components/rich-text-editor";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { toast } from "sonner";

export function NewsDetailHero({ article }: { article: NewsDetail }) {
  return (
    <section className="relative">
      <div className="relative min-h-[300px] overflow-hidden bg-secondary sm:min-h-[420px]">
        {article.coverImageUrl ? (
          <img src={article.coverImageUrl} alt={article.title} className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
        ) : (
          <div className="absolute inset-0 grad-crimson" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
        <div className="relative z-10 mx-auto max-w-4xl px-5 pb-10 pt-8 sm:px-8 sm:pb-12">
          <Link
            to="/news"
            className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/25"
          >
            All news
          </Link>
          <div className="flex flex-wrap gap-2">
            {article.category && <AppBadge variant="gold">{article.category}</AppBadge>}
            {article.isFeatured && <AppBadge variant="secondary">Featured</AppBadge>}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">{article.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/80">
            {article.author && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {article.author}
              </span>
            )}
            {article.publishedAt && <span>Published {fmtDate(article.publishedAt)}</span>}
            {article.readingTimeMinutes && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {article.readingTimeMinutes} min read
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function NewsShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/news/${slug}` : `/news/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled */
      }
      return;
    }
    copyLink();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-semibold text-muted-foreground">Share</span>
      <AppButton variant="outline" size="sm" shape="pill" onClick={nativeShare}>
        <Share2 className="h-4 w-4" />
        Share
      </AppButton>
      <AppButton variant="outline" size="sm" shape="pill" onClick={copyLink}>
        <Copy className="h-4 w-4" />
        Copy link
      </AppButton>
      <AppButton variant="outline" size="sm" shape="pill" asChild>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Share on X"
        >
          <Twitter className="h-4 w-4" />
        </a>
      </AppButton>
      <AppButton variant="outline" size="sm" shape="pill" asChild>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Share on Facebook"
        >
          <Facebook className="h-4 w-4" />
        </a>
      </AppButton>
      <AppButton variant="outline" size="sm" shape="pill" asChild>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="h-4 w-4" />
        </a>
      </AppButton>
    </div>
  );
}

export function NewsDetailBody({ article }: { article: NewsDetail }) {
  return (
    <div className="space-y-6">
      {article.summary && (
        <p className="text-lg font-medium leading-relaxed text-foreground/90 sm:text-xl">{article.summary}</p>
      )}
      <NewsShareButtons title={article.title} slug={article.slug} />
      {article.contentHtml && <RichTextContent html={article.contentHtml} className="text-base sm:text-lg" />}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {article.tags.map((tag) => (
            <AppBadge key={tag} variant="outline">
              {tag}
            </AppBadge>
          ))}
        </div>
      )}
    </div>
  );
}

export function NewsRelatedSection({ title, items }: { title: string; items: NewsAttachment[] }) {
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
