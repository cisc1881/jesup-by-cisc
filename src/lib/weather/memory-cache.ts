import type { CacheSetOptions, WeatherCacheAdapter } from "./cache-types";

type Entry<T> = {
  value: T;
  expiresAt: number;
  staleAt?: number;
};

const store = new Map<string, Entry<unknown>>();

export class MemoryWeatherCache implements WeatherCacheAdapter {
  async get<T>(key: string): Promise<T | null> {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, options: CacheSetOptions): Promise<void> {
    store.set(key, {
      value,
      expiresAt: Date.now() + options.ttlMs,
      staleAt: options.allowStaleOnError ? Date.now() + options.ttlMs * 2 : undefined,
    });
  }

  async delete(key: string): Promise<void> {
    store.delete(key);
  }

  getStaleIfPresent<T>(key: string): T | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.staleAt && Date.now() > entry.staleAt) {
      store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  clear(): void {
    store.clear();
  }
}

export const memoryWeatherCache = new MemoryWeatherCache();
