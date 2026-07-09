import { fetchPrograms } from "@/lib/programs";
import type { HomeProgram } from "./types";

export async function fetchHomePrograms(limit = 6): Promise<HomeProgram[]> {
  const programs = await fetchPrograms({ featuredOnly: true, limit });
  const fallback = programs.length > 0 ? programs : await fetchPrograms({ limit });

  return fallback.map((p) => ({
    slug: p.slug,
    name: p.name,
    short: p.short ?? p.name,
    tagline: p.tagline ?? "",
    imageUrl: p.coverImageUrl ?? "",
    categoryName: p.categoryName,
  }));
}
