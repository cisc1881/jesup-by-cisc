import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchPrograms = vi.hoisted(() => vi.fn());
vi.mock("@/lib/programs", () => ({ fetchPrograms }));
import { fetchHomePrograms } from "./programs-source";

describe("Home uses the active ordered catalog", () => {
  beforeEach(() => fetchPrograms.mockReset());

  it("requests the ordered catalog without a featured-only subset", async () => {
    fetchPrograms.mockResolvedValue([
      { slug: "environment-economics-energy-academy", name: "Environment, Economics, and Energy Academy (EEE Academy)", short: "Eight learning modules", coverImageUrl: null },
      { slug: "black-harvest-series", name: "Black Harvest Series", short: "Producer discussions", coverImageUrl: null },
    ]);
    const programs = await fetchHomePrograms(6);
    expect(fetchPrograms).toHaveBeenCalledExactlyOnceWith({ limit: 6 });
    expect(programs.map(p => p.slug)).toEqual(["environment-economics-energy-academy", "black-harvest-series"]);
    expect(programs[0].short).toBe("Environment, Economics, and Energy Academy (EEE Academy)");
    expect(programs[0].imageUrl).toBe("");
  });

  it("returns an empty catalog rather than recreating demo programs", async () => {
    fetchPrograms.mockResolvedValue([]);
    expect(await fetchHomePrograms()).toEqual([]);
    expect(fetchPrograms).toHaveBeenCalledTimes(1);
  });
});