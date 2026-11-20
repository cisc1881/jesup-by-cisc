import { describe, expect, it } from "vitest";
import { curatedContentImage, curatedMarketIdentity } from "./curated-content-images";

describe("curated content images", () => {
  it("uses the supplied photo in place of starter art", () => {
    expect(
      curatedContentImage("program", "black-harvest-series", "/starter/agricultural-extension.jpg"),
    ).toBe("/images/content/black-harvest-series.jpg");
    expect(curatedContentImage("event", "fc135", "/events/fc135-farmers-conference.jpg")).toBe(
      "/images/content/fc135-conference-art.jpg",
    );
    expect(curatedContentImage("program", "cisc-dialogue-model", "/starter/dialogue.jpg")).toBe(
      "/images/content/cisc-dialogue.jpg",
    );
    expect(curatedContentImage("program", "family-inc-x-cisc", "/starter/family.jpg")).toBe(
      "/images/content/family-inc.jpg",
    );
    expect(curatedContentImage("internship", "cisc-hbcu-graduate-fellowship-program")).toBe(
      "/images/content/chfp-cohort.jpg",
    );
  });

  it("keeps an editor's later cover upload", () => {
    expect(
      curatedContentImage("program", "black-harvest-series", "https://example.org/new-cover.jpg"),
    ).toBe("https://example.org/new-cover.jpg");
  });

  it("does not assign a photo to unrelated content", () => {
    expect(curatedContentImage("market", "unrelated-market", null)).toBeNull();
  });

  it("corrects the legacy Tuskegee market listing and its image", () => {
    expect(
      curatedMarketIdentity({
        id: "afac7fee-a95c-45d2-a35b-6729c52e4321",
        slug: "tuskegee-farmers-market",
        name: "Tuskegee Farmers Market",
        image_url: "/starter/market.jpg",
      }),
    ).toEqual({
      name: "Macon County Farmers Market",
      coverImageUrl: "/images/content/macon-county-farmers-market.jpg",
    });
  });
});
