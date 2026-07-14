import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearStoredWeatherLocation,
  createDefaultStoredLocation,
  readStoredWeatherLocation,
  writeStoredWeatherLocation,
} from "@/lib/weather/location-storage";
import { WEATHER_LOCATION_STORAGE_KEY } from "@/lib/weather/constants";

describe("weather location storage", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
    });
    clearStoredWeatherLocation();
  });

  it("restores a stored manual location", () => {
    writeStoredWeatherLocation({
      lat: 33.52,
      lon: -86.8,
      source: "manual",
      label: "Birmingham, AL",
      county: "Jefferson County",
      state: "AL",
    });

    const restored = readStoredWeatherLocation();
    expect(restored).toMatchObject({
      source: "manual",
      label: "Birmingham, AL",
      county: "Jefferson County",
    });
  });

  it("creates the Macon County default fallback location", () => {
    const fallback = createDefaultStoredLocation();
    expect(fallback.source).toBe("default");
    expect(fallback.county).toBe("Macon County");
    expect(fallback.label).toBe("Tuskegee, AL");
  });

  it("clears invalid stored values", () => {
    window.localStorage.setItem(WEATHER_LOCATION_STORAGE_KEY, "{ invalid");
    expect(readStoredWeatherLocation()).toBeNull();
  });
});
