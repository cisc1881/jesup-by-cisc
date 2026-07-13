export type CacheSetOptions = {
  ttlMs: number;
  /** When true, expired entries may be returned if no fresh value exists (non-alert data only). */
  allowStaleOnError?: boolean;
};

export interface WeatherCacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options: CacheSetOptions): Promise<void>;
  delete(key: string): Promise<void>;
}
