import { describe, expect, it } from "vitest";
import { sanitizeSurveyCsv } from "./survey-csv";

describe("sanitizeSurveyCsv", () => {
  it("removes identifying columns before producing model context", () => {
    const result = sanitizeSurveyCsv(
      'Email,Full Name,Satisfaction,Comments\nada@example.com,Ada,5,"Very useful"',
    );

    expect(result.excludedColumns).toEqual(["Email", "Full Name"]);
    expect(result.includedColumns).toEqual(["Satisfaction", "Comments"]);
    expect(result.content).toBe("Satisfaction | Comments\n5 | Very useful");
    expect(result.content).not.toContain("ada@example.com");
  });

  it("requires response data and non-identifying columns", () => {
    expect(() => sanitizeSurveyCsv("Question\n")).toThrow("at least one response");
    expect(() => sanitizeSurveyCsv("Email,Phone\na@b.com,555-0100")).toThrow(
      "No non-identifying survey columns",
    );
  });
});
