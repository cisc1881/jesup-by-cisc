import type { CacheSetOptions, WeatherCacheAdapter } from "./cache-types";
import { memoryWeatherCache } from "./memory-cache";

const CACHE_NAME = "jesup-weather-v1";

function toCacheRequest(key: string): Request {
  return new Request(`https://weather-cache.internal/${encodeURIComponent(key)}`);
}

export class CloudflareWeatherCache implements WeatherCacheAdapter {
  private fallback = memoryWeatherCache;

  private get cache(): Cache | null {
    try {
      return typeof caches !== "undefined" ? caches.default : null;
    } catch {
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const cache = this.cache;
    if (!cache) return this.fallback.get<T>(key);

    const response = await cache.match(toCacheRequest(key));
    if (!response) return this.fallback.get<T>(key);

    const expiresAt = Number(response.headers.get("x-expires-at") ?? "0");
    if (expiresAt && Date.now() > expiresAt) {
      await cache.delete(toCacheRequest(key));
      return null;
    }

    try {
      return (await response.json()) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheSetOptions): Promise<void> {
    await this.fallback.set(key, value, options);

    const cache = this.cache;
    if (!cache) return;

    const expiresAt = Date.now() + options.ttlMs;
    const response = new Response(JSON.stringify(value), {
      headers: {
        "content-type": "application/json",
        "cache-control": `max-age=${Math.ceil(options.ttlMs / 1000)}`,
        "x-expires-at": String(expiresAt),
        "x-cache-name": CACHE_NAME,
      },
    });

    await cache.put(toCacheRequest(key), response);
  }

  async delete(key: string): Promise<void> {
    await this.fallback.delete(key);
    const cache = this.cache;
    if (cache) await cache.delete(toCacheRequest(key));
  }
}
