import { describe, expect, it } from "vitest";
import { recommendHomeContent } from "./recommendations";

describe("recommendHomeContent", () => {
  it("returns only content matching explicit preferences", () => {
    const result = recommendHomeContent(
      { role: "farmer", interests: ["climate"] },
      [],
      [
        {
          slug: "climate-farm",
          name: "Climate Farm",
          short: "Resilient farming",
          tagline: "",
          imageUrl: "",
          categoryName: null,
        },
        {
          slug: "unrelated",
          name: "Campus arts",
          short: "Art",
          tagline: "",
          imageUrl: "",
          categoryName: null,
        },
      ],
    );
    expect(result.map((item) => item.id)).toEqual(["climate-farm"]);
  });

  it("does not invent recommendations without preferences", () => {
    expect(recommendHomeContent({ role: null, interests: [] }, [], [])).toEqual([]);
  });
});
