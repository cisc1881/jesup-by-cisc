import { describe, expect, it, beforeEach } from "vitest";
import { assertRateLimit, checkRateLimit, clearRateLimits } from "@/lib/weather/rate-limit";

describe("rate-limit behavior", () => {
  beforeEach(() => clearRateLimits());

  it("allows requests under the limit", () => {
    const result = checkRateLimit("geocode:test", 3, 60_000);
    expect(result.allowed).toBe(true);
  });

  it("blocks requests over the limit", () => {
    checkRateLimit("geocode:block", 2, 60_000);
    checkRateLimit("geocode:block", 2, 60_000);
    const blocked = checkRateLimit("geocode:block", 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("throws a weather service error when asserting limits", () => {
    assertRateLimit("weather:once", 1, 60_000);
    expect(() => assertRateLimit("weather:once", 1, 60_000)).toThrow(/Too many requests/);
  });
});
