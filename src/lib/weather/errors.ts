export type WeatherErrorCode =
  | "geolocation-unsupported"
  | "geolocation-denied"
  | "geolocation-timeout"
  | "geocoding-failed"
  | "nws-points-failed"
  | "nws-forecast-failed"
  | "nws-alerts-failed"
  | "nws-observation-failed"
  | "provider-offline"
  | "partial-response"
  | "unknown";

export class WeatherServiceError extends Error {
  readonly code: WeatherErrorCode;
  readonly cause?: unknown;

  constructor(code: WeatherErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "WeatherServiceError";
    this.code = code;
    this.cause = cause;
  }
}

export function isWeatherServiceError(error: unknown): error is WeatherServiceError {
  return error instanceof WeatherServiceError;
}
