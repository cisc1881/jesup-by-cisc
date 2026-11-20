import { ExternalLink } from "lucide-react";
import {
  LAND_GRANT_1890_SOURCE,
  landGrant1890Logo,
  landGrant1890Universities,
} from "@/lib/land-grant-1890";

export function LandGrantNetwork() {
  return (
    <section aria-labelledby="land-grant-network-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Our network</p>
          <h2
            id="land-grant-network-heading"
            className="mt-1 text-2xl font-black tracking-tight sm:text-3xl"
          >
            1890 Land-Grant Universities
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Explore the institutions that carry the 1890 land-grant mission across the country.
          </p>
        </div>
        <a
          href={LAND_GRANT_1890_SOURCE}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          View Foundation directory <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {landGrant1890Universities.map((university) => (
          <article
            key={university.slug}
            className="flex min-h-44 flex-col rounded-2xl border border-border bg-card p-4 shadow-token-soft"
          >
            <div className="mb-3 grid h-20 place-items-center rounded-xl bg-white p-2">
              <img
                src={landGrant1890Logo(university.slug) ?? undefined}
                alt={`${university.name} logo`}
                className="max-h-16 max-w-full object-contain"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            </div>
            <h3 className="text-sm font-bold leading-snug">{university.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{university.location}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
