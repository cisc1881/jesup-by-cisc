import { describe, expect, it } from "vitest";
import {
  mapNwsAlerts,
  mapNwsForecastDays,
  mapNwsSeverity,
  mapShortForecastToConditionCode,
} from "@/lib/weather/mapper";
import type { NwsForecastPeriod } from "@/lib/weather/providers/nws";

describe("mapNwsSeverity", () => {
  it("maps warnings and emergencies from NWS fields", () => {
    expect(mapNwsSeverity("Severe Thunderstorm Warning", "Severe", "Immediate")).toBe("emergency");
    expect(mapNwsSeverity("Severe Thunderstorm Warning", "Severe", "Expected")).toBe("warning");
    expect(mapNwsSeverity("Severe Thunderstorm Watch", "Moderate", "Future")).toBe("watch");
    expect(mapNwsSeverity("Heat Advisory", "Minor", "Expected")).toBe("advisory");
  });
});

describe("mapShortForecastToConditionCode", () => {
  it("maps common NWS short forecasts", () => {
    expect(mapShortForecastToConditionCode("Slight Chance Thunderstorms")).toBe("thunderstorm");
    expect(mapShortForecastToConditionCode("Showers Likely")).toBe("rain");
    expect(mapShortForecastToConditionCode("Mostly Sunny")).toBe("clear");
    expect(mapShortForecastToConditionCode("Hot and Humid")).toBe("hot");
  });
});

describe("mapNwsForecastDays", () => {
  it("pairs day and night periods into daily highs and lows", () => {
    const periods: NwsForecastPeriod[] = [
      {
        number: 1,
        name: "Today",
        startTime: "2026-07-12T12:00:00-05:00",
        isDaytime: true,
        temperature: 90,
        temperatureUnit: "F",
        shortForecast: "Partly Sunny",
        detailedForecast: "Partly sunny.",
        probabilityOfPrecipitation: { value: 20 },
        windSpeed: "5 mph",
        windDirection: "SW",
      },
      {
        number: 2,
        name: "Tonight",
        startTime: "2026-07-12T22:00:00-05:00",
        isDaytime: false,
        temperature: 72,
        temperatureUnit: "F",
        shortForecast: "Mostly Clear",
        detailedForecast: "Mostly clear.",
        probabilityOfPrecipitation: { value: 10 },
        windSpeed: "3 mph",
        windDirection: "S",
      },
      {
        number: 3,
        name: "Monday",
        startTime: "2026-07-13T12:00:00-05:00",
        isDaytime: true,
        temperature: 88,
        temperatureUnit: "F",
        shortForecast: "Chance Showers",
        detailedForecast: "Showers possible.",
        probabilityOfPrecipitation: { value: 55 },
        windSpeed: "8 mph",
        windDirection: "W",
      },
    ];

    const days = mapNwsForecastDays(periods);
    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({ highF: 90, lowF: 72, rainProbabilityPercent: 20 });
    expect(days[1]).toMatchObject({ highF: 88, lowF: 88, rainProbabilityPercent: 55 });
  });
});

describe("mapNwsAlerts", () => {
  it("maps alert properties into the UI alert model", () => {
    const alerts = mapNwsAlerts([
      {
        id: "https://api.weather.gov/alerts/urn:oid:1",
        event: "Flood Warning",
        severity: "Severe",
        urgency: "Expected",
        headline: "Flood Warning for Macon County",
        description: "Flooding is expected near streams.",
        instruction: "Avoid flooded roads.",
        effective: "2026-07-12T10:00:00-05:00",
        expires: "2026-07-12T18:00:00-05:00",
        senderName: "NWS Birmingham AL",
      },
    ]);

    expect(alerts[0]).toMatchObject({
      title: "Flood Warning",
      severity: "warning",
      source: "NWS Birmingham AL",
      recommendedAction: "Avoid flooded roads.",
    });
  });
});
