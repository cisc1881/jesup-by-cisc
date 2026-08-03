import { describe, expect, it } from "vitest";

import { parseInternshipAudience } from "./internships";

describe("parseInternshipAudience", () => {
  it("treats legacy 2FAS internships as Tuskegee-only", () => {
    expect(parseInternshipAudience(undefined, { is2fas: true })).toEqual({
      institutionIds: [],
      institutionSlugs: ["tuskegee-university"],
      networkWide: false,
      otherInstitutions: false,
    });
  });

  it("treats ordinary legacy internships as network-wide", () => {
    expect(parseInternshipAudience(undefined)).toEqual({
      institutionIds: [],
      institutionSlugs: [],
      networkWide: true,
      otherInstitutions: false,
    });
  });

  it("prefers an explicit audience over the legacy fallback", () => {
    expect(
      parseInternshipAudience({ network_wide: true, institution_slugs: [] }, { is2fas: true }),
    ).toMatchObject({ networkWide: true, institutionSlugs: [] });
  });
});
