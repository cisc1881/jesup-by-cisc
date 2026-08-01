import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type DirectoryResult = {
  id: string;
  title: string;
  subtitle?: string | null;
  detail?: string | null;
  imageUrl?: string | null;
  to: "/events/$id" | "/programs/$slug";
  params: { id: string } | { slug: string };
};

export function DirectoryResultList({
  title,
  results,
  className,
}: {
  title: string;
  results: DirectoryResult[];
  className?: string;
}) {
  return (
    <section className={cn("border-y border-border bg-background", className)}>
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <h2 className="text-base font-extrabold text-foreground sm:text-lg">
          {title} ({results.length})
        </h2>
      </div>
      <div className="divide-y-[6px] divide-muted">
        {results.map((result) => (
          <Link
            key={result.id}
            to={result.to as never}
            params={result.params as never}
            className="group grid min-h-28 grid-cols-[72px_minmax(0,1fr)_24px] items-center gap-4 bg-background px-4 py-5 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 sm:grid-cols-[92px_minmax(0,1fr)_28px] sm:px-6"
          >
            <div className="grid aspect-square w-[72px] place-items-center overflow-hidden border border-border bg-muted sm:w-[92px]">
              {result.imageUrl ? (
                <img
                  src={result.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <CalendarDays className="h-8 w-8 institution-accent-text" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold leading-tight text-foreground group-hover:institution-accent-text sm:text-xl">
                {result.title}
              </h3>
              {result.subtitle && (
                <p className="mt-1.5 text-sm leading-snug text-muted-foreground sm:text-base">
                  {result.subtitle}
                </p>
              )}
              {result.detail && (
                <p className="mt-1 text-sm leading-snug text-muted-foreground sm:text-base">
                  {result.detail}
                </p>
              )}
            </div>
            <ChevronRight className="h-6 w-6 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </Link>
        ))}
      </div>
    </section>
  );
}
