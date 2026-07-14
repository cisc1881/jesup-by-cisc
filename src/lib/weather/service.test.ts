import { describe, expect, it } from "vitest";
import { buildFallbackWeatherData } from "@/lib/weather/service";

describe("provider error fallback", () => {
  it("returns demo fallback data flagged as fallback", async () => {
    const fallback = await buildFallbackWeatherData();
    expect(fallback.isDemo).toBe(true);
    expect(fallback.isFallback).toBe(true);
    expect(fallback.alerts).toEqual([]);
    expect(fallback.countyPreparedness.contactAvailable).toBe(true);
    expect(fallback.radar?.available).toBe(true);
  });
});
