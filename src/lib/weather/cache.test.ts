import { describe, expect, it } from "vitest";
import { normalizeCacheKey } from "@/lib/weather/cache-factory";
import { MemoryWeatherCache } from "@/lib/weather/memory-cache";

describe("cache key normalization", () => {
  it("normalizes coordinates and labels into stable keys", () => {
    expect(normalizeCacheKey(["nws", "alerts", 32.424, -85.6916])).toBe("nws:alerts:32.424:-85.6916");
    expect(normalizeCacheKey(["geo", "forward", " Tuskegee, AL "])).toBe("geo:forward:tuskegee,-al");
  });
});

describe("TTL behavior", () => {
  it("expires entries after ttl", async () => {
    const cache = new MemoryWeatherCache();
    await cache.set("test", { ok: true }, { ttlMs: 20 });
    expect(await cache.get("test")).toEqual({ ok: true });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(await cache.get("test")).toBeNull();
  });
});

describe("alerts cache freshness", () => {
  it("does not return alerts after ttl expires", async () => {
    const cache = new MemoryWeatherCache();
    await cache.set("alerts", [{ id: "a1" }], { ttlMs: 10 });
    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(await cache.get("alerts")).toBeNull();
  });
});
