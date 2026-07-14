import { describe, expect, it } from "vitest";
import { sanitizeRichText } from "./safe-rich-text";

describe("sanitizeRichText", () => {
  it("keeps review formatting and safe links", () => {
    expect(
      sanitizeRichText(
        '<h2>Overview</h2><p><strong>Safe</strong> <a href="https://cisc.edu">link</a></p>',
      ),
    ).toBe(
      '<h2>Overview</h2><p><strong>Safe</strong> <a href="https://cisc.edu" target="_blank" rel="noreferrer">link</a></p>',
    );
  });

  it("removes active content and unsafe attributes", () => {
    expect(
      sanitizeRichText(
        '<script>alert(1)</script><p onclick="bad()">Text</p><a href="javascript:bad()">No</a>',
      ),
    ).toBe("alert(1)<p>Text</p><a>No</a>");
  });
});
