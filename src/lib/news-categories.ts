export const NEWS_CATEGORIES = [
  "Extension News",
  "Research",
  "Student Spotlight",
  "Faculty Spotlight",
  "Community Impact",
  "Events",
  "Awards",
  "Grants",
  "Success Stories",
  "Agriculture",
  "Youth Development",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export function newsFilterCategories(existing: (string | null | undefined)[]) {
  const used = new Set(existing.filter(Boolean) as string[]);
  const ordered = NEWS_CATEGORIES.filter((c) => used.has(c));
  for (const c of used) {
    if (!NEWS_CATEGORIES.includes(c as NewsCategory)) ordered.push(c);
  }
  return ["All", ...ordered];
}
