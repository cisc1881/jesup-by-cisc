export const PUBLICATION_CONTENT_TYPES = [
  { value: "factsheet", label: "Factsheet" },
  { value: "report", label: "Report" },
  { value: "magazine", label: "Magazine" },
  { value: "newsletter", label: "Newsletter" },
  { value: "video", label: "Video" },
  { value: "external_link", label: "External Link" },
  { value: "research_publication", label: "Research Publication" },
  { value: "extension_bulletin", label: "Extension Bulletin" },
] as const;

export type PublicationContentType = (typeof PUBLICATION_CONTENT_TYPES)[number]["value"];

export function publicationContentTypeLabel(value: string | null | undefined) {
  return PUBLICATION_CONTENT_TYPES.find((t) => t.value === value)?.label ?? value ?? "";
}
