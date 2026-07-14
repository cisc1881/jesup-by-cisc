import type { NwsAlertProperties } from "@/lib/weather/providers/nws";
import { mapNwsAlerts, mapNwsSeverity } from "@/lib/weather/mapper";
import type { MappedNwsAlertForDelivery } from "./types";

function toIsoOrNow(value?: string): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function mapNwsAlertPropertiesForDelivery(
  alert: NwsAlertProperties,
): MappedNwsAlertForDelivery {
  const eventName = alert.event ?? alert.headline ?? "Weather alert";
  const severity = mapNwsSeverity(eventName, alert.severity, alert.urgency);

  return {
    id: alert.id,
    severity,
    eventName,
    effectiveAt: toIsoOrNow(alert.effective ?? alert.onset),
    expiresAt: toIsoOrNow(alert.expires ?? alert.ends),
  };
}

export function mapNwsAlertsForDelivery(alerts: NwsAlertProperties[]): MappedNwsAlertForDelivery[] {
  return alerts.map(mapNwsAlertPropertiesForDelivery);
}

export function mapSevereAlertsForDelivery(
  alerts: ReturnType<typeof mapNwsAlerts>,
): MappedNwsAlertForDelivery[] {
  return alerts.map((alert) => ({
    id: alert.id,
    severity: alert.severity,
    eventName: alert.title,
    effectiveAt: alert.effectiveAt,
    expiresAt: alert.expiresAt,
  }));
}

export type LocationGroupKey = string;

export function locationGroupKey(input: {
  countyName: string | null;
  stateCode: string | null;
  latitudeBucket: number | null;
  longitudeBucket: number | null;
}): LocationGroupKey | null {
  if (input.latitudeBucket != null && input.longitudeBucket != null) {
    return `bucket:${input.latitudeBucket}:${input.longitudeBucket}`;
  }
  if (input.countyName && input.stateCode) {
    return `county:${input.stateCode.toUpperCase()}:${input.countyName.trim().toLowerCase()}`;
  }
  return null;
}

export function coordinatesForGroupKey(key: LocationGroupKey): { lat: number; lon: number } | null {
  if (key.startsWith("bucket:")) {
    const [, lat, lon] = key.split(":");
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { lat: latitude, lon: longitude };
    }
  }
  return null;
}

export async function resolveCoordinatesForGroupKey(
  key: LocationGroupKey,
): Promise<{ lat: number; lon: number } | null> {
  const bucketCoords = coordinatesForGroupKey(key);
  if (bucketCoords) return bucketCoords;

  if (key.startsWith("county:")) {
    const [, state, county] = key.split(":");
    if (!state || !county) return null;

    const { geocodeManualLocation } = await import("@/lib/weather/service");
    const place = await geocodeManualLocation(`${county} County, ${state}`);
    return { lat: place.lat, lon: place.lon };
  }

  return null;
}
