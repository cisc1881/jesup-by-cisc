/** Photos supplied for named JESUP content. New covers uploaded by an editor take precedence. */
const CONTENT_IMAGES = {
  event: {
    fc135: "/images/content/fc135-conference-art.jpg",
  },
  program: {
    "black-belt-marketing-innovation-center":
      "/images/content/black-belt-marketing-innovation-center.jpg",
    "black-harvest-series": "/images/content/black-harvest-series.jpg",
    "cisc-dialogue-model": "/images/content/cisc-dialogue.jpg",
    "environment-economics-energy-academy": "/images/content/eee-academy.jpg",
    "family-inc-x-cisc": "/images/content/family-inc.jpg",
    "small-farm-rural-development": "/images/content/small-farm-rural-development.jpg",
    "state-of-african-americans-black-belt":
      "/images/content/state-of-african-americans-black-belt.jpg",
    tuaic: "/images/content/tuaic.jpg",
    "tuskegee-meat-science-program": "/images/content/tuskegee-meat-science-program.jpg",
  },
  market: {
    "macon-county-farmers-market": "/images/content/macon-county-farmers-market.jpg",
    "tuskegee-farmers-market": "/images/content/macon-county-farmers-market.jpg",
  },
  internship: {
    "cisc-hbcu-graduate-fellowship-program": "/images/content/chfp-cohort.jpg",
  },
} as const;

export const SMALL_FARM_GALLERY_IMAGE = "/images/content/small-farm-rural-development-alt.jpg";
export const MACON_COUNTY_MARKET_NAME = "Macon County Farmers Market";
export const LEGACY_TUSKEGEE_MARKET_ID = "afac7fee-a95c-45d2-a35b-6729c52e4321";

export function curatedMarketIdentity(market: {
  id: string;
  slug?: string | null;
  name: string;
  image_url?: string | null;
}) {
  const isLegacyListing =
    market.id === LEGACY_TUSKEGEE_MARKET_ID && market.name === "Tuskegee Farmers Market";
  return {
    name: isLegacyListing ? MACON_COUNTY_MARKET_NAME : market.name,
    coverImageUrl: isLegacyListing
      ? "/images/content/macon-county-farmers-market.jpg"
      : curatedContentImage("market", market.slug, market.image_url),
  };
}

export function curatedContentImage(
  kind: keyof typeof CONTENT_IMAGES,
  slug: string | null | undefined,
  existing?: string | null,
): string | null {
  const photo = slug ? (CONTENT_IMAGES[kind] as Record<string, string>)[slug] : undefined;
  if (!photo) return existing ?? null;
  // Starter art and the prior FC135 fallback were placeholders. Keep an editor's
  // later storage upload visible instead of locking the cover in source code.
  if (
    existing &&
    !existing.startsWith("/starter/") &&
    !existing.startsWith("/events/fc135-farmers-conference.jpg") &&
    !existing.startsWith("/images/content/") &&
    !existing.startsWith("https://images.unsplash.com/")
  )
    return existing;
  return photo;
}
