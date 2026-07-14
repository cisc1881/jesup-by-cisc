import { Link } from "@tanstack/react-router";
import { Clock, User } from "lucide-react";
import type { NewsListItem } from "@/lib/news";
import { AppBadge, AppButton, AppCard } from "@/components/design-system";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type NewsCardProps = {
  article: NewsListItem;
  className?: string;
  variant?: "default" | "featured";
};

export function NewsCard({ article, className, variant = "default" }: NewsCardProps) {
  const isFeatured = variant === "featured";

  return (
    <AppCard
      variant="lift"
      padding="none"
      className={cn("flex h-full flex-col overflow-hidden", isFeatured && "sm:flex-row", className)}
    >
      <Link
        to="/news/$slug"
        params={{ slug: article.slug }}
        className={cn("block shrink-0", isFeatured ? "sm:w-[45%]" : "w-full")}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-secondary",
            isFeatured ? "aspect-[16/10] h-full min-h-[220px] sm:aspect-auto sm:min-h-[280px]" : "aspect-[16/10]",
          )}
        >
          {article.coverImageUrl ? (
            <img src={article.coverImageUrl} alt={`${article.title} cover`} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center grad-crimson text-primary-foreground">
              <span className="text-4xl font-black opacity-30">NEWS</span>
            </div>
          )}
        </div>
      </Link>

      <div className={cn("flex flex-1 flex-col", isFeatured ? "p-5 sm:p-7" : "p-4 sm:p-5")}>
        <div className="mb-2 flex flex-wrap gap-2">
          {article.category && <AppBadge variant="gold">{article.category}</AppBadge>}
          {article.isFeatured && <AppBadge variant="secondary">Featured</AppBadge>}
        </div>

        <Link to="/news/$slug" params={{ slug: article.slug }}>
          <h3
            className={cn(
              "line-clamp-2 font-black tracking-[var(--tracking-tight)] text-foreground",
              isFeatured ? "text-2xl sm:text-3xl" : "text-lg",
            )}
          >
            {article.title}
          </h3>
        </Link>

        {article.summary && (
          <p className={cn("mt-2 text-muted-foreground", isFeatured ? "line-clamp-4 text-base" : "line-clamp-3 text-sm")}>
            {article.summary}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
          {article.author && (
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {article.author}
            </span>
          )}
          {article.publishedAt && <span>{fmtDate(article.publishedAt)}</span>}
          {article.readingTimeMinutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {article.readingTimeMinutes} min read
            </span>
          )}
        </div>

        <div className="mt-auto pt-4">
          <AppButton variant={isFeatured ? "primary" : "outline"} size="sm" shape="pill" asChild>
            <Link to="/news/$slug" params={{ slug: article.slug }}>
              Read story
            </Link>
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
}
