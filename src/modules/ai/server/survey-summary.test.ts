import { describe, expect, it } from "vitest";
import { parseSurveySummary } from "./survey-summary";

describe("parseSurveySummary", () => {
  it("normalizes a structured summary", () => {
    expect(
      parseSurveySummary(
        '```json\n{"executiveSummary":" Useful feedback. ","themes":["Access", "Access"],"strengths":["Staff"],"concerns":[],"recommendedActions":["Follow up"]}\n```',
      ),
    ).toEqual({
      executiveSummary: "Useful feedback.",
      themes: ["Access"],
      strengths: ["Staff"],
      concerns: [],
      recommendedActions: ["Follow up"],
    });
  });

  it("rejects invalid or incomplete output", () => {
    expect(() => parseSurveySummary("nope")).toThrow("invalid survey summary");
    expect(() => parseSurveySummary('{"themes":[]}')).toThrow("invalid survey summary");
  });
});
