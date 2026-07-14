export { getWeatherCache, normalizeCacheKey, resetWeatherCacheForTests } from "./cache-factory";
export { memoryWeatherCache, MemoryWeatherCache } from "./memory-cache";
export type { WeatherCacheAdapter, CacheSetOptions } from "./cache-types";

/** @deprecated Use getWeatherCache() */
export { memoryWeatherCache as legacyMemoryCache } from "./memory-cache";
