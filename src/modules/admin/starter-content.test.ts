import { describe, expect, it } from "vitest";
import { starterEvents, starterMarkets, starterPartners, starterPrograms } from "./starter-content";

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
  });
});
