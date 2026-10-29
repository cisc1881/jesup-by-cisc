import { describe, expect, it } from "vitest";
import { walletPassState } from "./wallet";

describe("walletPassState", () => {
  const now = new Date("2026-10-29T12:00:00Z");
  it("hides future and expired credentials", () => {
    expect(
      walletPassState(
        { status: "active", valid_from: "2026-10-30T00:00:00Z", valid_until: null },
        now,
      ),
    ).toBe("upcoming");
    expect(
      walletPassState(
        { status: "active", valid_from: null, valid_until: "2026-10-28T00:00:00Z" },
        now,
      ),
    ).toBe("expired");
  });
  it("keeps revoked passes revoked", () => {
    expect(walletPassState({ status: "revoked", valid_from: null, valid_until: null }, now)).toBe(
      "revoked",
    );
  });
});
