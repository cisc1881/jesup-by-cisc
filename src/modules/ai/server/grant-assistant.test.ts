import { describe, expect, it } from "vitest";
import { parseGrantDraft } from "./grant-assistant";

describe("parseGrantDraft", () => {
  it("parses a supported grant draft", () => {
    expect(
      parseGrantDraft(
        '{"title":"Farm Fund","funder":"Foundation","description":"Supports eligible farm projects.","amount":"Up to $25,000","deadline":"2026-10-15"}',
      ),
    ).toEqual({
      title: "Farm Fund",
      funder: "Foundation",
      description: "Supports eligible farm projects.",
      amount: "Up to $25,000",
      deadline: "2026-10-15",
    });
  });

  it("rejects missing content and discards invalid dates", () => {
    expect(() => parseGrantDraft('{"title":"","description":""}')).toThrow();
    expect(
      parseGrantDraft('{"title":"Fund","description":"Summary","deadline":"2026-02-31"}').deadline,
    ).toBe("");
  });
});
