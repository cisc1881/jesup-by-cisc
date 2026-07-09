export const PARTNERSHIP_FOCUS_AREAS = [
  "Agriculture",
  "Food Systems",
  "Research",
  "Education",
  "Extension",
  "Youth Development",
  "Community Development",
  "Technology",
  "Climate",
  "Forestry",
  "Water Resources",
  "Natural Resources",
  "Entrepreneurship",
  "Grants & Funding",
  "Conservation",
] as const;

export type PartnershipFocusArea = (typeof PARTNERSHIP_FOCUS_AREAS)[number];

export function isPartnershipFocusArea(value: string): value is PartnershipFocusArea {
  return (PARTNERSHIP_FOCUS_AREAS as readonly string[]).includes(value);
}
