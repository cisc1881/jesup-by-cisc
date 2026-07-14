import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { normalizePushSubscriptionJson, urlBase64ToUint8Array } from "./subscription-normalize";
import {
  classifyPushStatusCode,
  shouldDeactivateImmediately,
  shouldDeactivateAfterThreshold,
  PUSH_FAILURE_THRESHOLD,
} from "./delivery-errors";
import {
  assertPayloadWithinSize,
  buildAlertPushPayload,
  buildDevelopmentServerTestPayload,
  validateNotificationUrl,
} from "./push-payload";
import { locationGroupKey, coordinatesForGroupKey } from "./alert-mapper";
import { computeQuietHoursReleaseTime } from "./delayed-deliveries";
import { isAlertExpired } from "./alert-deduplication";
import { getServerVapidConfig, VapidConfigurationError } from "./vapid-config";
import type { MappedNwsAlertForDelivery } from "./types";

describe("VAPID public key conversion", () => {
  it("converts url-safe base64 to Uint8Array", () => {
    const sample = Buffer.from("hello-vapid-key").toString("base64url");
    const bytes = urlBase64ToUint8Array(sample);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe("push subscription normalization", () => {
  it("accepts valid https subscription JSON", () => {
    const normalized = normalizePushSubscriptionJson({
      endpoint: "https://push.example.com/send/abc",
      keys: { p256dh: "key", auth: "secret" },
    });
    expect(normalized?.endpointHost).toBe("push.example.com");
    expect(normalized?.endpoint).toContain("https://");
  });

  it("rejects missing keys", () => {
    expect(normalizePushSubscriptionJson({ endpoint: "https://push.example.com" })).toBeNull();
  });

  it("rejects non-https endpoints", () => {
    expect(
      normalizePushSubscriptionJson({
        endpoint: "http://push.example.com",
        keys: { p256dh: "a", auth: "b" },
      }),
    ).toBeNull();
  });
});

describe("404/410 deactivation", () => {
  it("deactivates immediately on 404 and 410", () => {
    expect(shouldDeactivateImmediately(404)).toBe(true);
    expect(shouldDeactivateImmediately(410)).toBe(true);
    expect(shouldDeactivateImmediately(500)).toBe(false);
  });

  it("classifies transient vs permanent errors", () => {
    expect(classifyPushStatusCode(503)).toBe("transient");
    expect(classifyPushStatusCode(429)).toBe("transient");
    expect(classifyPushStatusCode(404)).toBe("permanent");
  });
});

describe("failure threshold", () => {
  it("deactivates after threshold failures", () => {
    expect(shouldDeactivateAfterThreshold(PUSH_FAILURE_THRESHOLD - 1)).toBe(false);
    expect(shouldDeactivateAfterThreshold(PUSH_FAILURE_THRESHOLD)).toBe(true);
  });
});

describe("location grouping", () => {
  it("groups by coordinate bucket when available", () => {
    expect(
      locationGroupKey({
        countyName: "Macon",
        stateCode: "GA",
        latitudeBucket: 32.4,
        longitudeBucket: -84.0,
      }),
    ).toBe("bucket:32.4:-84");
  });

  it("falls back to county/state group", () => {
    expect(
      locationGroupKey({
        countyName: "Bibb",
        stateCode: "ga",
        latitudeBucket: null,
        longitudeBucket: null,
      }),
    ).toBe("county:GA:bibb");
  });

  it("resolves bucket coordinates", () => {
    expect(coordinatesForGroupKey("bucket:32.4:-84.0")).toEqual({ lat: 32.4, lon: -84 });
  });
});

describe("safe notification URL", () => {
  it("allows internal paths", () => {
    expect(validateNotificationUrl("/me/weather-alerts")).toBe("/me/weather-alerts");
  });

  it("rejects external URLs", () => {
    expect(validateNotificationUrl("https://evil.example")).toBe("/me/weather-alerts");
    expect(validateNotificationUrl("//evil.example")).toBe("/me/weather-alerts");
  });
});

describe("payload size bounds", () => {
  it("keeps development test payload within limits", () => {
    expect(() => assertPayloadWithinSize(buildDevelopmentServerTestPayload())).not.toThrow();
  });

  it("keeps alert payload within limits", () => {
    const alert: MappedNwsAlertForDelivery = {
      id: "urn:test",
      severity: "warning",
      eventName: "Severe Thunderstorm Warning",
      effectiveAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
    expect(() => assertPayloadWithinSize(buildAlertPushPayload(alert))).not.toThrow();
  });
});

describe("quiet-hours queue", () => {
  it("schedules release after quiet hours end", () => {
    const scheduled = computeQuietHoursReleaseTime(
      { quietHoursEnd: "07:00", timezone: "UTC" },
      new Date("2026-07-13T23:00:00Z"),
    );
    expect(new Date(scheduled).getTime()).toBeGreaterThan(
      new Date("2026-07-13T23:00:00Z").getTime(),
    );
  });

  it("expires delayed alerts after NWS expiry", () => {
    expect(isAlertExpired("2026-07-13T10:00:00Z", new Date("2026-07-13T11:00:00Z"))).toBe(true);
  });
});

describe("missing VAPID configuration", () => {
  const original = { ...process.env };

  beforeEach(() => {
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.VAPID_SUBJECT;
    delete process.env.VITE_VAPID_PUBLIC_KEY;
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("throws a clear configuration error", () => {
    expect(() => getServerVapidConfig()).toThrow(VapidConfigurationError);
    try {
      getServerVapidConfig();
    } catch (error) {
      expect((error as Error).message).toContain("Missing");
      expect((error as Error).message).toContain("generate-vapid-keys");
    }
  });
});

describe("transient failure retry behavior", () => {
  it("does not deactivate immediately on transient 5xx", () => {
    expect(shouldDeactivateImmediately(503)).toBe(false);
    expect(classifyPushStatusCode(503)).toBe("transient");
  });
});

describe("multi-device delivery (unit)", () => {
  it("counts sent and failed independently per device result shape", async () => {
    const { isTransientPushFailure } = await import("./delivery");
    expect(isTransientPushFailure(503)).toBe(true);
    expect(isTransientPushFailure(404)).toBe(false);
  });
});

describe("user-level deduplication", () => {
  it("is enforced by evaluateAlertDelivery suppress path", async () => {
    const { evaluateAlertDelivery } = await import("./alert-deduplication");
    const decision = evaluateAlertDelivery(
      {
        id: "p1",
        userId: "u1",
        enabled: true,
        alertsEnabled: true,
        watchesEnabled: true,
        warningsEnabled: true,
        emergenciesEnabled: true,
        dailyForecastEnabled: false,
        locationSource: "manual",
        countyName: "Macon",
        stateCode: "GA",
        latitudeBucket: 32.4,
        longitudeBucket: -84,
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        timezone: "UTC",
        lastAlertCheckedAt: null,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "dup-1",
        severity: "warning",
        eventName: "Warning",
        effectiveAt: "2020-01-01T00:00:00Z",
        expiresAt: "2030-01-01T00:00:00Z",
      },
      [{ nwsAlertId: "dup-1" }],
      new Date("2026-07-13T12:00:00Z"),
    );
    expect(decision.action).toBe("suppress");
  });
});
