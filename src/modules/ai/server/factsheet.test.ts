import { describe, expect, it } from "vitest";
import { parseFactsheetDraft } from "./factsheet";

describe("parseFactsheetDraft", () => {
  it("accepts fenced JSON and normalizes bounded metadata", () => {
    const draft = parseFactsheetDraft(`\`\`\`json
      {"title":"  Soil   Health Basics ","description":" Practical   research notes. ","author":"","tags":["Soil", "soil", "Farming"],"contentHtml":"<h2>Soil health</h2><p onclick='bad()'>Start with verified research.</p>"}
      \`\`\``);

    expect(draft).toEqual({
      title: "Soil Health Basics",
      description: "Practical research notes.",
      author: "CISC at Tuskegee University",
      tags: ["soil", "farming"],
      contentHtml: "<h2>Soil health</h2><p>Start with verified research.</p>",
    });
  });

  it("rejects malformed or incomplete drafts", () => {
    expect(() => parseFactsheetDraft("not json")).toThrow("invalid factsheet draft");
    expect(() => parseFactsheetDraft('{"title":"Only a title","tags":[]}')).toThrow(
      "missing a title or description",
    );
  });
});
