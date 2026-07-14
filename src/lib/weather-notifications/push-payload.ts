import type { MappedNwsAlertForDelivery } from "./types";

export const MAX_PUSH_TITLE_LENGTH = 120;
export const MAX_PUSH_BODY_LENGTH = 240;
export const MAX_PUSH_PAYLOAD_BYTES = 3800;

const EXTERNAL_URL = /:\/\//;

export type WeatherPushPayload = {
  title: string;
  body: string;
  icon: string;
  tag: string;
  url: string;
  test?: boolean;
};

export function sanitizePushText(value: string, maxLength: number): string {
  return Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127 ? " " : character;
  })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function validateNotificationUrl(url: string | undefined | null): string {
  const fallback = "/me/weather-alerts";
  if (!url) return fallback;

  const trimmed = url.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (EXTERNAL_URL.test(trimmed)) return fallback;

  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded.startsWith("//") || EXTERNAL_URL.test(decoded)) return fallback;
  } catch {
    return fallback;
  }

  return trimmed;
}

export function buildAlertPushPayload(
  alert: Pick<MappedNwsAlertForDelivery, "id" | "eventName" | "severity">,
  options?: { url?: string; test?: boolean },
): WeatherPushPayload {
  return {
    title: sanitizePushText(`JESUP: ${alert.eventName}`, MAX_PUSH_TITLE_LENGTH),
    body: sanitizePushText(
      `${alert.severity.charAt(0).toUpperCase()}${alert.severity.slice(1)} weather alert for your area.`,
      MAX_PUSH_BODY_LENGTH,
    ),
    icon: "/favicon.ico",
    tag: `jesup-weather-${alert.id}`.slice(0, 64),
    url: validateNotificationUrl(options?.url ?? "/"),
    ...(options?.test ? { test: true } : {}),
  };
}

export function buildDevelopmentServerTestPayload(): WeatherPushPayload {
  return {
    title: "Development only — JESUP server push test",
    body: "This is a development server push test. No live NWS alert was sent.",
    icon: "/favicon.ico",
    tag: "jesup-weather-dev-server-test",
    url: "/me/weather-alerts",
    test: true,
  };
}

export function assertPayloadWithinSize(payload: WeatherPushPayload): void {
  const bytes = new TextEncoder().encode(JSON.stringify(payload)).length;
  if (bytes > MAX_PUSH_PAYLOAD_BYTES) {
    throw new Error(`Push payload exceeds ${MAX_PUSH_PAYLOAD_BYTES} bytes.`);
  }
}
