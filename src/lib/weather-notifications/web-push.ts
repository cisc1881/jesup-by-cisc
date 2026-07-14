import webpush from "web-push";
import { getServerVapidConfig } from "./vapid-config";
import type { PushSubscriptionRecord } from "./types";
import { assertPayloadWithinSize, type WeatherPushPayload } from "./push-payload";
import { extractPushStatusCode } from "./delivery-errors";

let configured = false;

function ensureWebPushConfigured(): void {
  if (configured) return;
  const vapid = getServerVapidConfig();
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  configured = true;
}

export type WebPushSendResult = {
  ok: boolean;
  statusCode?: number;
  errorMessage?: string;
};

export async function sendWebPushToSubscription(
  subscription: Pick<PushSubscriptionRecord, "endpoint" | "p256dh" | "auth">,
  payload: WeatherPushPayload,
): Promise<WebPushSendResult> {
  ensureWebPushConfigured();
  assertPayloadWithinSize(payload);

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
      { TTL: 3600 },
    );
    return { ok: true, statusCode: 201 };
  } catch (error) {
    const statusCode = extractPushStatusCode(error);
    return {
      ok: false,
      statusCode,
      errorMessage: error instanceof Error ? error.message : "Push send failed",
    };
  }
}
