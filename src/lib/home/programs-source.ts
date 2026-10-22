import { fetchPrograms } from "@/lib/programs";
import type { HomeProgram } from "./types";

export async function fetchHomePrograms(limit = 6): Promise<HomeProgram[]> {
  const programs = await fetchPrograms({ limit });

  return programs.map((p) => ({
    slug: p.slug,
    name: p.name,
    short: p.name,
    tagline: p.short ?? p.tagline ?? "",
    imageUrl: p.coverImageUrl ?? "",
    categoryName: p.categoryName,
  }));
}
