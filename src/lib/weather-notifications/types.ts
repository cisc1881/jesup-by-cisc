import type { WeatherSeverity } from "@/lib/weather/types";

export type WeatherNotificationLocationSource = "live" | "manual" | "default" | "profile";

export type PushPermissionState = "unsupported" | "default" | "granted" | "denied";

export type WeatherAlertDeliveryStatus = "pending" | "sent" | "suppressed" | "failed" | "test";

export interface WeatherNotificationPreferences {
  id: string;
  userId: string;
  enabled: boolean;
  alertsEnabled: boolean;
  watchesEnabled: boolean;
  warningsEnabled: boolean;
  emergenciesEnabled: boolean;
  dailyForecastEnabled: boolean;
  locationSource: WeatherNotificationLocationSource | null;
  countyName: string | null;
  stateCode: string | null;
  latitudeBucket: number | null;
  longitudeBucket: number | null;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
  lastAlertCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WeatherNotificationPreferencesInput = Omit<
  WeatherNotificationPreferences,
  "id" | "userId" | "createdAt" | "updatedAt" | "lastAlertCheckedAt"
> & {
  lastAlertCheckedAt?: string | null;
};

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
  deviceLabel: string | null;
  isActive: boolean;
  lastSuccessAt: string | null;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}

export type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  deviceLabel?: string;
};

export interface ProcessedWeatherAlertRecord {
  id: string;
  nwsAlertId: string;
  userId: string;
  severity: WeatherSeverity;
  eventName: string;
  sentAt: string | null;
  expiresAt: string;
  deliveryStatus: WeatherAlertDeliveryStatus;
  failureReason: string | null;
  createdAt: string;
}

export interface MappedNwsAlertForDelivery {
  id: string;
  severity: WeatherSeverity;
  eventName: string;
  effectiveAt: string;
  expiresAt: string;
}

export type AlertDeliveryDecision =
  | { action: "send" }
  | { action: "suppress"; reason: string }
  | { action: "delay"; reason: string };

export type WeatherNotificationCtaStatus =
  | "signed-out"
  | "not-subscribed"
  | "subscribed"
  | "permission-denied"
  | "unsupported";

export interface AdminWeatherNotificationSummary {
  enabledUsers: number;
  activeSubscriptions: number;
  failedSubscriptions: number;
  processedAlertsLast7Days: number;
  recentProcessedAlerts: Array<{
    id: string;
    eventName: string;
    severity: string;
    deliveryStatus: WeatherAlertDeliveryStatus;
    createdAt: string;
  }>;
}

/** Admin-safe subscription row — no p256dh/auth key material. */
export interface AdminPushSubscriptionRow {
  id: string;
  userId: string;
  deviceLabel: string | null;
  isActive: boolean;
  failureCount: number;
  lastSuccessAt: string | null;
  revokedAt: string | null;
  updatedAt: string;
  endpointHost: string;
}
