import { CloudflareWeatherCache } from "./cloudflare-cache";
import type { WeatherCacheAdapter } from "./cache-types";
import { MemoryWeatherCache, memoryWeatherCache } from "./memory-cache";

let adapter: WeatherCacheAdapter | null = null;

function isCloudflareWorkerRuntime(): boolean {
  try {
    return typeof caches !== "undefined" && typeof (globalThis as { Cloudflare?: unknown }).Cloudflare !== "undefined";
  } catch {
    return typeof caches !== "undefined";
  }
}

export function getWeatherCache(): WeatherCacheAdapter {
  if (adapter) return adapter;

  adapter = isCloudflareWorkerRuntime() ? new CloudflareWeatherCache() : memoryWeatherCache;
  return adapter;
}

export function resetWeatherCacheForTests(next: WeatherCacheAdapter = new MemoryWeatherCache()): WeatherCacheAdapter {
  adapter = next;
  return adapter;
}

export function normalizeCacheKey(parts: Array<string | number>): string {
  return parts
    .map((part) =>
      String(part)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-"),
    )
    .join(":");
}
