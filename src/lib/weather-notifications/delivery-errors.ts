export const PUSH_FAILURE_THRESHOLD = 5;

export type PushErrorClass = "permanent" | "transient" | "unknown";

export function classifyPushStatusCode(statusCode: number | undefined): PushErrorClass {
  if (statusCode == null) return "unknown";
  if (statusCode === 404 || statusCode === 410) return "permanent";
  if (statusCode >= 500) return "transient";
  if (statusCode === 429) return "transient";
  if (statusCode >= 400) return "permanent";
  return "unknown";
}

export function shouldDeactivateImmediately(statusCode: number | undefined): boolean {
  return statusCode === 404 || statusCode === 410;
}

export function shouldDeactivateAfterThreshold(failureCount: number): boolean {
  return failureCount >= PUSH_FAILURE_THRESHOLD;
}

export function extractPushStatusCode(error: unknown): number | undefined {
  if (error && typeof error === "object" && "statusCode" in error) {
    const code = Number((error as { statusCode?: number }).statusCode);
    return Number.isFinite(code) ? code : undefined;
  }
  return undefined;
}

export function pushErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown push delivery error";
}
