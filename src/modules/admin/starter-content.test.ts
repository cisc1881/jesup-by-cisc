import { describe, expect, it } from "vitest";
import {
  starterEvents,
  starterInternships,
  starterMarkets,
  starterPartners,
  starterPodcasts,
  starterPrograms,
} from "./starter-content";
import {
  starterGrants,
  starterInstitutionDemos,
  starterInstitutionEvents,
  starterProgramWorkshops,
  starterPublications,
  starterSurveys,
} from "./starter-network-content";

describe("starter content database defaults", () => {
  it("explicitly supplies required JSON and boolean fields for bulk upserts", () => {
    for (const program of starterPrograms) {
      expect(program.metadata).toBeDefined();
    }

    for (const event of starterEvents) {
      expect(event.metadata).toBeDefined();
    }

    for (const market of starterMarkets) {
      expect(market.metadata).toBeDefined();
      expect(market.accepts_credit).toEqual(expect.any(Boolean));
      expect(market.accepts_snap_ebt).toEqual(expect.any(Boolean));
    }

    for (const partner of starterPartners) {
      expect(partner.social_links).toBeDefined();
    }

    for (const podcast of starterPodcasts) {
      expect(podcast.is_published).toBe(true);
      expect(podcast.is_featured).toEqual(expect.any(Boolean));
    }

    for (const internship of starterInternships) {
      expect(internship.is_2fas).toBe(true);
      expect(internship.is_open).toBe(true);
    }
  });

  it("matches the approved program, podcast, and 2FAS names", () => {
    expect(starterPrograms).toEqual([]);
    expect(starterPodcasts.map((podcast) => podcast.title)).toEqual([
      "2FAS Podcast",
      "Earth2TU",
      "Growing the Green",
    ]);
    expect(starterInternships.map((internship) => internship.title)).toEqual([
      "CISC HBCU Graduate Fellowship Program",
      "SEI High School",
      "SEI Undergraduates",
      "Graduate Extension Interns/Fellows",
    ]);
  });

  it("provides complete institution, program, and resource demo coverage", () => {
    expect(starterInstitutionDemos).toHaveLength(19);
    expect(starterInstitutionEvents).toHaveLength(38);
    expect(starterProgramWorkshops).toHaveLength(9);
    expect(
      new Set(
        starterInstitutionEvents.map(
          (event) => (event.metadata as Record<string, unknown>).institution_slug,
        ),
      ).size,
    ).toBe(19);
    expect(starterPublications.length).toBeGreaterThan(0);
    expect(starterGrants.length).toBeGreaterThan(0);
    expect(starterSurveys.length).toBeGreaterThan(0);
  });
});
