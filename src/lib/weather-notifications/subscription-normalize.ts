import type { PushSubscriptionInput } from "./types";

export type NormalizedPushSubscription = PushSubscriptionInput & {
  endpointHost: string;
};

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  if (typeof globalThis.atob === "function") {
    const rawData = globalThis.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const buffer = Buffer.from(base64, "base64");
  return new Uint8Array(buffer);
}

export function maskEndpointHost(endpoint: string): string {
  try {
    return new URL(endpoint).host;
  } catch {
    return "unknown-host";
  }
}

export function normalizePushSubscriptionJson(
  json: {
    endpoint?: string | null;
    keys?: { p256dh?: string | null; auth?: string | null } | null;
  },
  meta?: { userAgent?: string; deviceLabel?: string },
): NormalizedPushSubscription | null {
  const endpoint = json.endpoint?.trim();
  const p256dh = json.keys?.p256dh?.trim();
  const auth = json.keys?.auth?.trim();

  if (!endpoint || !p256dh || !auth) return null;
  if (!endpoint.startsWith("https://")) return null;

  return {
    endpoint,
    p256dh,
    auth,
    userAgent: meta?.userAgent ?? null,
    deviceLabel: meta?.deviceLabel ?? null,
    endpointHost: maskEndpointHost(endpoint),
  };
}

export function normalizeBrowserPushSubscription(
  subscription: PushSubscription,
  meta?: { userAgent?: string; deviceLabel?: string },
): NormalizedPushSubscription | null {
  return normalizePushSubscriptionJson(subscription.toJSON(), meta);
}
