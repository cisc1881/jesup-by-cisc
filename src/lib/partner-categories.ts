export const PARTNER_CATEGORIES = [
  "University & Extension",
  "Federal Government",
  "Research",
  "Community Organization",
  "Corporate",
  "Foundation",
  "Conservation & Natural Resources",
] as const;

export type PartnerCategory = (typeof PARTNER_CATEGORIES)[number];

export function isPartnerCategory(value: string | null | undefined): value is PartnerCategory {
  return !!value && (PARTNER_CATEGORIES as readonly string[]).includes(value);
}

export function partnerFilterCategories(existing: (string | null | undefined)[]) {
  const used = new Set(existing.filter(Boolean) as string[]);
  const ordered = PARTNER_CATEGORIES.filter((c) => used.has(c));
  for (const c of used) {
    if (!PARTNER_CATEGORIES.includes(c as PartnerCategory)) ordered.push(c);
  }
  return ["All", ...ordered];
}

/** Impact counter groupings derived from CMS category values. */
export const PARTNER_IMPACT_GROUPS = [
  { id: "strategicPartners", label: "Strategic Partners", categories: null as PartnerCategory[] | null },
  { id: "federalAgencies", label: "Federal Agencies", categories: ["Federal Government"] as PartnerCategory[] },
  {
    id: "universitiesResearch",
    label: "Universities & Research Centers",
    categories: ["University & Extension", "Research"] as PartnerCategory[],
  },
  {
    id: "communityOrganizations",
    label: "Community Organizations",
    categories: ["Community Organization"] as PartnerCategory[],
  },
  { id: "corporatePartners", label: "Corporate Partners", categories: ["Corporate"] as PartnerCategory[] },
  { id: "foundations", label: "Foundations", categories: ["Foundation"] as PartnerCategory[] },
] as const;
