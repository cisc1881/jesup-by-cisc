import { describe, expect, it } from "vitest";
import { parseImpactReportNarrative } from "./impact-report";

describe("parseImpactReportNarrative", () => {
  it("normalizes validated narrative fields", () => {
    const result = parseImpactReportNarrative(
      '{"reportTitle":" Event Impact ","eventPurpose":"Purpose","programGoals":"Goals","outcomesImpactNotes":" 42 attended. ","recommendations":"Review results","followUpActions":"Follow up"}',
    );
    expect(result.reportTitle).toBe("Event Impact");
    expect(result.outcomesImpactNotes).toBe("42 attended.");
  });

  it("rejects incomplete output", () => {
    expect(() => parseImpactReportNarrative("nope")).toThrow("invalid impact report narrative");
    expect(() => parseImpactReportNarrative('{"reportTitle":"Title"}')).toThrow(
      "invalid impact report narrative",
    );
  });
});
