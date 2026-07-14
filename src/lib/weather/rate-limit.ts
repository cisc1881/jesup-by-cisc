import { WeatherServiceError } from "./errors";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  retryAfterMs?: number;
  remaining?: number;
};

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: maxRequests - bucket.count };
}

export function assertRateLimit(key: string, maxRequests: number, windowMs: number): void {
  const result = checkRateLimit(key, maxRequests, windowMs);
  if (!result.allowed) {
    throw new WeatherServiceError(
      "provider-offline",
      `Too many requests. Try again in ${Math.ceil((result.retryAfterMs ?? windowMs) / 1000)} seconds.`,
    );
  }
}

export function clearRateLimits(): void {
  buckets.clear();
}

export async function withTransientRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 400;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts - 1) break;
      if (error instanceof WeatherServiceError && error.code === "provider-offline") {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (attempt + 1)));
        continue;
      }
      break;
    }
  }

  throw lastError;
}
