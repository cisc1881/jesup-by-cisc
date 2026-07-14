import { toast } from "sonner";

export const JESUP_SITE_NAME = "JESUP";
export const JESUP_SITE_TAGLINE = "The Digital Extension Wagon";
export const JESUP_DEFAULT_DESCRIPTION =
  "Programs, workshops, publications, and opportunities from the Carver Integrative Sustainability Center at Tuskegee University.";
export const JESUP_DEFAULT_SOCIAL_IMAGE = "/social/jesup-social-share.png";

/** Public site origin for canonical URLs and JSON-LD. Override with VITE_SITE_URL in production. */
export const JESUP_SITE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) ||
  "https://jesup.cisc1881.org";

export type PageSeoInput = {
  title: string;
  description?: string | null;
  path?: string;
  imageUrl?: string | null;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function absoluteUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${JESUP_SITE_URL.replace(/\/$/, "")}${normalized}`;
}

function absoluteMediaUrl(url: string) {
  return new URL(url, `${JESUP_SITE_URL.replace(/\/$/, "")}/`).toString();
}

export function buildPageHead(input: PageSeoInput) {
  const title = input.title.includes("JESUP") ? input.title : `${input.title} · JESUP`;
  const description = input.description?.trim() || JESUP_DEFAULT_DESCRIPTION;
  const canonical = input.path ? absoluteUrl(input.path) : undefined;
  const ogType = input.type ?? "website";
  const socialImage = absoluteMediaUrl(input.imageUrl || JESUP_DEFAULT_SOCIAL_IMAGE);

  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: ogType },
    { property: "og:site_name", content: JESUP_SITE_NAME },
    { property: "og:image", content: socialImage },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: `${JESUP_SITE_NAME} by CISC` },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: socialImage },
  ];

  if (input.noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  if (canonical) {
    meta.push({ property: "og:url", content: canonical });
  }

  const links: Array<Record<string, string>> = [];
  if (canonical) {
    links.push({ rel: "canonical", href: canonical });
  }

  const scripts: Array<Record<string, string>> = [];
  if (input.jsonLd) {
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify(input.jsonLd),
    });
  }

  return { meta, links, scripts };
}

export function articleJsonLd(input: {
  title: string;
  description?: string | null;
  path: string;
  imageUrl?: string | null;
  author?: string | null;
  publishedAt?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description ?? undefined,
    image: input.imageUrl ?? undefined,
    author: input.author ? { "@type": "Person", name: input.author } : undefined,
    datePublished: input.publishedAt ?? undefined,
    publisher: {
      "@type": "Organization",
      name: "Carver Integrative Sustainability Center",
      url: JESUP_SITE_URL,
    },
    mainEntityOfPage: absoluteUrl(input.path),
  };
}

export function organizationJsonLd(input: {
  name: string;
  description?: string | null;
  path: string;
  imageUrl?: string | null;
  url?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    description: input.description ?? undefined,
    image: input.imageUrl ?? undefined,
    url: input.url ?? absoluteUrl(input.path),
  };
}

export function eventJsonLd(input: {
  title: string;
  description?: string | null;
  path: string;
  imageUrl?: string | null;
  startsAt?: string | null;
  location?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.title,
    description: input.description ?? undefined,
    image: input.imageUrl ?? undefined,
    startDate: input.startsAt ?? undefined,
    location: input.location
      ? { "@type": "Place", name: input.location }
      : undefined,
    organizer: {
      "@type": "Organization",
      name: "Carver Integrative Sustainability Center",
      url: JESUP_SITE_URL,
    },
    url: absoluteUrl(input.path),
  };
}

export function podcastEpisodeJsonLd(input: {
  title: string;
  description?: string | null;
  path: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: input.title,
    description: input.description ?? undefined,
    image: input.imageUrl ?? undefined,
    datePublished: input.publishedAt ?? undefined,
    partOfSeries: {
      "@type": "PodcastSeries",
      name: "JESUP Podcast",
      url: absoluteUrl("/podcasts"),
    },
    url: absoluteUrl(input.path),
  };
}

export function publicationJsonLd(input: {
  title: string;
  description?: string | null;
  path: string;
  imageUrl?: string | null;
  author?: string | null;
  publishedAt?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: input.title,
    description: input.description ?? undefined,
    image: input.imageUrl ?? undefined,
    author: input.author ? { "@type": "Person", name: input.author } : undefined,
    datePublished: input.publishedAt ?? undefined,
    url: absoluteUrl(input.path),
  };
}

export function placeJsonLd(input: {
  name: string;
  description?: string | null;
  path: string;
  imageUrl?: string | null;
  address?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.name,
    description: input.description ?? undefined,
    image: input.imageUrl ?? undefined,
    address: input.address ?? undefined,
    url: absoluteUrl(input.path),
  };
}

export function programJsonLd(input: {
  name: string;
  description?: string | null;
  path: string;
  imageUrl?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.name,
    description: input.description ?? undefined,
    image: input.imageUrl ?? undefined,
    provider: {
      "@type": "Organization",
      name: "Carver Integrative Sustainability Center",
      url: JESUP_SITE_URL,
    },
    url: absoluteUrl(input.path),
  };
}

export function listPageHead(input: { title: string; description: string; path: string }) {
  return buildPageHead({
    title: input.title,
    description: input.description,
    path: input.path,
    type: "website",
  });
}

export function formatUserErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

export function toastActionError(context: string, err: unknown) {
  toast.error(formatUserErrorMessage(err, `${context} failed. Please try again.`));
}
