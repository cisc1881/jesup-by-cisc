import { curatedContentImage } from "@/lib/curated-content-images";

export const FC135_COVER_IMAGE = "/events/fc135-farmers-conference.jpg";

/** Keep an organizer-supplied cover editable in the Command Center. */
export function resolveEventCoverImage(
  slug: string | null | undefined,
  imageUrl: string | null | undefined,
) {
  return (
    curatedContentImage("event", slug, imageUrl) ?? (slug === "fc135" ? FC135_COVER_IMAGE : null)
  );
}

export function eventCoverImageAlt(imageUrl: string | null | undefined, eventTitle: string) {
  return imageUrl === FC135_COVER_IMAGE ? "Photo from a previous Farmers Conference" : eventTitle;
}
