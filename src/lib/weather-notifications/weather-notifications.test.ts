import { describe, expect, it } from "vitest";
import {
  evaluateAlertDelivery,
  isAlertActive,
  isAlertExpired,
  isDuplicateProcessedAlert,
} from "./alert-deduplication";
import { bucketCoordinate, bucketCoordinates } from "./coordinate-buckets";
import { severityPreferenceEnabled } from "./preferences-matching";
import { isQuietHoursActive, shouldBypassQuietHours } from "./quiet-hours";
import { resolvePushNotificationStatus } from "./push-status";
import type { MappedNwsAlertForDelivery, WeatherNotificationPreferences } from "./types";

function basePreferences(
  overrides: Partial<WeatherNotificationPreferences> = {},
): WeatherNotificationPreferences {
  return {
    id: "pref-1",
    userId: "user-1",
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
    longitudeBucket: -84.0,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    timezone: "America/New_York",
    lastAlertCheckedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function baseAlert(overrides: Partial<MappedNwsAlertForDelivery> = {}): MappedNwsAlertForDelivery {
  return {
    id: "urn:oid:2.49.0.1.840.0.abcdef",
    severity: "warning",
    eventName: "Severe Thunderstorm Warning",
    effectiveAt: "2020-01-01T10:00:00Z",
    expiresAt: "2030-01-01T12:00:00Z",
    ...overrides,
  };
}

const activeNow = new Date("2026-07-13T11:00:00Z");

describe("severity preference matching", () => {
  it("allows advisory when alerts are enabled", () => {
    expect(severityPreferenceEnabled(basePreferences(), "advisory")).toBe(true);
  });

  it("suppresses watch when watches are disabled", () => {
    expect(severityPreferenceEnabled(basePreferences({ watchesEnabled: false }), "watch")).toBe(
      false,
    );
  });

  it("suppresses all severities when alerts are disabled", () => {
    const prefs = basePreferences({ alertsEnabled: false });
    expect(severityPreferenceEnabled(prefs, "advisory")).toBe(false);
    expect(severityPreferenceEnabled(prefs, "warning")).toBe(false);
  });
});

describe("quiet hours", () => {
  it("suppresses non-emergency alerts during quiet hours", () => {
    const prefs = basePreferences({
      quietHoursEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      timezone: "UTC",
    });
    const now = new Date("2026-07-13T23:30:00Z");

    const decision = evaluateAlertDelivery(prefs, baseAlert({ severity: "warning" }), [], now);
    expect(decision.action).toBe("delay");
  });

  it("lets emergency alerts bypass quiet hours", () => {
    expect(shouldBypassQuietHours("emergency")).toBe(true);
    const prefs = basePreferences({
      quietHoursEnabled: true,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      timezone: "UTC",
    });
    const now = new Date("2026-07-13T23:30:00Z");

    const decision = evaluateAlertDelivery(
      prefs,
      baseAlert({ severity: "emergency", eventName: "Tornado Emergency" }),
      [],
      now,
    );
    expect(decision.action).toBe("send");
  });

  it("detects quiet hours within same-day window", () => {
    const prefs = basePreferences({
      quietHoursEnabled: true,
      quietHoursStart: "09:00",
      quietHoursEnd: "17:00",
      timezone: "UTC",
    });
    expect(isQuietHoursActive(prefs, new Date("2026-07-13T10:00:00Z"))).toBe(true);
    expect(isQuietHoursActive(prefs, new Date("2026-07-13T18:00:00Z"))).toBe(false);
  });
});

describe("alert deduplication", () => {
  it("rejects expired alerts", () => {
    expect(isAlertExpired("2026-07-13T10:00:00Z", new Date("2026-07-13T11:00:00Z"))).toBe(true);
    expect(
      isAlertActive(
        baseAlert({ effectiveAt: "2026-07-13T10:00:00Z", expiresAt: "2026-07-13T12:00:00Z" }),
        new Date("2026-07-13T13:00:00Z"),
      ),
    ).toBe(false);
  });

  it("rejects duplicate NWS alert IDs for the same user", () => {
    const processed = [{ nwsAlertId: "alert-123" }];
    expect(isDuplicateProcessedAlert(processed, "alert-123")).toBe(true);

    const decision = evaluateAlertDelivery(
      basePreferences(),
      baseAlert({ id: "alert-123" }),
      processed,
      activeNow,
    );
    expect(decision.action).toBe("suppress");
  });

  it("allows first delivery for a new alert", () => {
    const decision = evaluateAlertDelivery(basePreferences(), baseAlert(), [], activeNow);
    expect(decision.action).toBe("send");
  });
});

describe("coordinate bucketing", () => {
  it("rounds coordinates to 0.1 degree buckets", () => {
    expect(bucketCoordinate(32.424)).toBe(32.4);
    expect(bucketCoordinate(-85.6916)).toBe(-85.7);
    expect(bucketCoordinates(32.424, -85.6916)).toEqual({
      latitudeBucket: 32.4,
      longitudeBucket: -85.7,
    });
  });
});

describe("push notification status", () => {
  it("reports signed-out when no user", () => {
    expect(
      resolvePushNotificationStatus({
        user: null,
        isSupported: true,
        permission: "default",
        preferences: null,
      }),
    ).toBe("signed-out");
  });

  it("reports unsupported browser", () => {
    expect(
      resolvePushNotificationStatus({
        user: { id: "u1" },
        isSupported: false,
        permission: "unsupported",
        preferences: null,
      }),
    ).toBe("unsupported");
  });

  it("reports permission denied", () => {
    expect(
      resolvePushNotificationStatus({
        user: { id: "u1" },
        isSupported: true,
        permission: "denied",
        preferences: { enabled: false },
      }),
    ).toBe("permission-denied");
  });

  it("reports subscribed when preferences enabled with active subscription", () => {
    expect(
      resolvePushNotificationStatus({
        user: { id: "u1" },
        isSupported: true,
        permission: "granted",
        preferences: { enabled: true },
        vapidConfigured: true,
        activeSubscriptionCount: 1,
      }),
    ).toBe("subscribed");
  });

  it("reports configuration-missing when VAPID is not configured", () => {
    expect(
      resolvePushNotificationStatus({
        user: { id: "u1" },
        isSupported: true,
        permission: "granted",
        preferences: { enabled: true },
        vapidConfigured: false,
      }),
    ).toBe("configuration-missing");
  });

  it("reports subscription-failed when no active devices", () => {
    expect(
      resolvePushNotificationStatus({
        user: { id: "u1" },
        isSupported: true,
        permission: "granted",
        preferences: { enabled: true },
        vapidConfigured: true,
        activeSubscriptionCount: 0,
      }),
    ).toBe("subscription-failed");
  });

  it("reports not-subscribed when signed in but disabled", () => {
    expect(
      resolvePushNotificationStatus({
        user: { id: "u1" },
        isSupported: true,
        permission: "granted",
        preferences: { enabled: false },
      }),
    ).toBe("not-subscribed");
  });
});
