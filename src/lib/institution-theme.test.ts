import { describe, expect, it } from "vitest";
import { JESUP_NETWORK_THEME, resolveContentTheme, resolveInstitutionTheme, getReadableForeground } from "./institution-theme";

describe("institution theme precedence", () => {
  it("keeps FC135 network-themed without a selected school", () => {
    expect(resolveContentTheme({metadata:{theme_preset:"tuskegee",network_wide:true}}).key).toBe("jesup-network");
  });
  it("uses the selected school instead of content ownership", () => {
    expect(resolveContentTheme({metadata:{owner_institution_name:"Tuskegee University"}}, "Alcorn State University").key).toBe("alcorn");
  });
  it("does not auto-theme CISC programs for unselected guests", () => {
    expect(resolveContentTheme({metadata:{content_source:"CISC program page",source_url:"https://cisc1881.org/programs-projects/tuaic/"}}).key).toBe("jesup-network");
  });
  it("keeps unrelated and unattributed content in network colors", () => {
    expect(resolveContentTheme({metadata:{source_url:"https://example.com/tuskegee"}})).toEqual(JESUP_NETWORK_THEME);
  });
  it("validates event overrides instead of accepting arbitrary CSS", () => {
    expect(resolveContentTheme({themeAccent:"url(example.com)"})).toEqual(JESUP_NETWORK_THEME);
    expect(resolveContentTheme({themeAccent:"#7a0c16"})).toEqual(JESUP_NETWORK_THEME);
  });
  it("preserves recognized selected-institution resolution", () => {
    expect(resolveInstitutionTheme("Alcorn State University").key).toBe("alcorn");
  });
  it("chooses readable foregrounds for Tuskegee maroon and gold", () => {
    expect(getReadableForeground("#61000f")).toBe("#ffffff");
    expect(getReadableForeground("#e6b31e")).toBe("#171717");
  });
});