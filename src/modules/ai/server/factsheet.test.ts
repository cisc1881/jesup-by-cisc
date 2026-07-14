import { describe, expect, it } from "vitest";
import { parseFactsheetDraft } from "./factsheet";

describe("parseFactsheetDraft", () => {
  it("accepts fenced JSON and normalizes bounded metadata", () => {
    const draft = parseFactsheetDraft(`\`\`\`json
      {"title":"  Soil   Health Basics ","description":" Practical   research notes. ","author":"","tags":["Soil", "soil", "Farming"]}
      \`\`\``);

    expect(draft).toEqual({
      title: "Soil Health Basics",
      description: "Practical research notes.",
      author: "CISC at Tuskegee University",
      tags: ["soil", "farming"],
    });
  });

  it("rejects malformed or incomplete drafts", () => {
    expect(() => parseFactsheetDraft("not json")).toThrow("invalid factsheet draft");
    expect(() => parseFactsheetDraft('{"title":"Only a title","tags":[]}')).toThrow(
      "missing a title or description",
    );
  });
});
