import { describe, expect, it } from "vitest";
import { buildCountyPreparedness, isMaconCountyAlabama } from "@/lib/weather/county-data";

describe("county preparedness mapping", () => {
  it("detects Macon County, Alabama", () => {
    expect(isMaconCountyAlabama("Macon County", "AL")).toBe(true);
    expect(isMaconCountyAlabama("Macon", "Alabama")).toBe(true);
    expect(isMaconCountyAlabama("Macon County", "GA")).toBe(false);
  });

  it("returns verified Macon County contact for Macon County, AL", () => {
    const result = buildCountyPreparedness("Macon County", "AL");
    expect(result.contactAvailable).toBe(true);
    expect(result.phone).toBe("334-724-2626");
    expect(result.verificationStatus).toBe("verified");
    expect(result.agencyName).toContain("Macon County Emergency Management");
  });

  it("returns generic preparedness without invented contacts for other counties", () => {
    const result = buildCountyPreparedness("Jefferson County", "AL");
    expect(result.contactAvailable).toBe(false);
    expect(result.phone).toBeNull();
    expect(result.verificationStatus).toBe("generic");
    expect(result.guidance.length).toBeGreaterThan(0);
  });
});
