import { describe, expect, it } from "vitest";
import { distanceMeters, isInsideCircularGeofence, validateGeoPoint } from "./geofence";

describe("event geofences", () => {
  const tuskegee = { lat: 32.4302, lng: -85.7077 };
  it("recognizes a nearby attendee", () =>
    expect(isInsideCircularGeofence({ lat: 32.4304, lng: -85.7078 }, tuskegee, 100)).toBe(true));
  it("rejects a distant attendee", () =>
    expect(isInsideCircularGeofence({ lat: 32.45, lng: -85.7 }, tuskegee, 100)).toBe(false));
  it("returns a useful distance", () => expect(distanceMeters(tuskegee, tuskegee)).toBe(0));
  it("validates GIS coordinate ranges", () => {
    expect(validateGeoPoint(tuskegee)).toBe(true);
    expect(validateGeoPoint({ lat: 91, lng: 0 })).toBe(false);
  });
});
