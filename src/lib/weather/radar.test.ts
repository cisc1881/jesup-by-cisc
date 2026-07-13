import { describe, expect, it } from "vitest";
import { buildNwsRadarInfo, buildUnavailableRadarInfo } from "@/lib/weather/radar";

describe("radar fallback URL generation", () => {
  it("builds NWS office and loop URLs from WFO code", () => {
    const radar = buildNwsRadarInfo("BMX", { lat: 32.424, lon: -85.6916 });
    expect(radar.available).toBe(true);
    expect(radar.radarPageUrl).toBe("https://www.weather.gov/bmx");
    expect(radar.openInNewWindowUrl).toContain("BMX");
  });

  it("returns unavailable radar info when no WFO is known", () => {
    const radar = buildUnavailableRadarInfo();
    expect(radar.available).toBe(false);
    expect(radar.radarPageUrl).toContain("weather.gov");
  });
});
