import type {
  CurrentConditions,
  ForecastDay,
  GeocodedPlace,
  SevereWeatherAlert,
  WeatherConditionCode,
  WeatherSeverity,
} from "../types";
import type {
  NwsAlertProperties,
  NwsForecastPeriod,
  NwsObservationProperties,
} from "./providers/nws";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function mapShortForecastToConditionCode(shortForecast: string): WeatherConditionCode {
  const text = shortForecast.toLowerCase();
  if (text.includes("thunder")) return "thunderstorm";
  if (text.includes("shower") || text.includes("rain") || text.includes("drizzle")) return "rain";
  if (text.includes("hot")) return "hot";
  if (text.includes("wind")) return "wind";
  if (text.includes("partly")) return "partly-cloudy";
  if (text.includes("cloud") || text.includes("overcast") || text.includes("fog")) return "cloudy";
  if (text.includes("sunny") || text.includes("clear")) return "clear";
  return "partly-cloudy";
}

export function mapNwsSeverity(
  event: string,
  severity?: string,
  urgency?: string,
): WeatherSeverity {
  const eventLower = event.toLowerCase();

  if (severity === "Extreme" || urgency === "Immediate") return "emergency";
  if (eventLower.includes("warning")) return "warning";
  if (eventLower.includes("watch")) return "watch";
  if (eventLower.includes("advisory")) return "advisory";
  if (severity === "Severe") return "warning";
  if (severity === "Moderate") return "watch";
  return "advisory";
}

function celsiusToFahrenheit(value: number): number {
  return Math.round((value * 9) / 5 + 32);
}

function metersPerSecondToMph(value: number): number {
  return Math.round(value * 2.237);
}

function parseWindSpeedMph(windSpeed: string): number {
  const match = windSpeed.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function parseWindDirection(degrees?: number | null, fallback?: string): string {
  if (degrees == null || Number.isNaN(degrees)) return fallback ?? "—";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index] ?? fallback ?? "—";
}

function toIsoOrNow(value?: string): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function weekdayLabel(isoDate: string): string {
  const date = new Date(isoDate);
  return WEEKDAYS[date.getDay()] ?? date.toLocaleDateString(undefined, { weekday: "short" });
}

function dayKey(isoDate: string): string {
  return isoDate.slice(0, 10);
}

export function mapNwsAlerts(alerts: NwsAlertProperties[]): SevereWeatherAlert[] {
  return alerts.map((alert) => {
    const title = alert.event ?? alert.headline ?? "Weather alert";
    const severity = mapNwsSeverity(title, alert.severity, alert.urgency);

    return {
      id: alert.id,
      title,
      severity,
      effectiveAt: toIsoOrNow(alert.effective ?? alert.onset),
      expiresAt: toIsoOrNow(alert.expires ?? alert.ends),
      shortDescription: alert.headline ?? alert.description?.split("\n")[0] ?? title,
      recommendedAction:
        alert.instruction?.trim() ||
        "Monitor trusted local sources and follow guidance from the National Weather Service.",
      details: [alert.description, alert.instruction].filter(Boolean).join("\n\n"),
      source: alert.senderName ?? "National Weather Service",
    };
  });
}

export function mapNwsForecastDays(periods: NwsForecastPeriod[]): ForecastDay[] {
  const byDay = new Map<string, { high?: NwsForecastPeriod; low?: NwsForecastPeriod }>();

  for (const period of periods) {
    const key = dayKey(period.startTime);
    const bucket = byDay.get(key) ?? {};

    if (period.isDaytime) {
      bucket.high = period;
    } else {
      bucket.low = period;
    }

    byDay.set(key, bucket);
  }

  const days: ForecastDay[] = [];

  for (const [key, bucket] of byDay.entries()) {
    const source = bucket.high ?? bucket.low;
    if (!source) continue;

    const highF = bucket.high?.temperature ?? bucket.low?.temperature ?? 0;
    const lowF = bucket.low?.temperature ?? bucket.high?.temperature ?? highF;
    const rain =
      bucket.high?.probabilityOfPrecipitation?.value ??
      bucket.low?.probabilityOfPrecipitation?.value ??
      0;

    days.push({
      weekday: weekdayLabel(key),
      conditionCode: mapShortForecastToConditionCode(source.shortForecast),
      condition: source.shortForecast,
      highF,
      lowF,
      rainProbabilityPercent: rain ?? 0,
    });
  }

  return days.slice(0, 7);
}

export function mapObservationToCurrent(
  observation: NwsObservationProperties,
  hourlyFallback?: NwsForecastPeriod,
): CurrentConditions {
  const tempC = observation.temperature?.value;
  const temperatureF =
    tempC != null
      ? celsiusToFahrenheit(tempC)
      : (hourlyFallback?.temperature ?? 0);

  const heatIndexC = observation.heatIndex?.value;
  const windChillC = observation.windChill?.value;
  const feelsLikeF =
    heatIndexC != null
      ? celsiusToFahrenheit(heatIndexC)
      : windChillC != null
        ? celsiusToFahrenheit(windChillC)
        : temperatureF;

  const humidity = Math.round(observation.relativeHumidity?.value ?? 0);
  const windMps = observation.windSpeed?.value;
  const windMph =
    windMps != null
      ? metersPerSecondToMph(windMps)
      : hourlyFallback
        ? parseWindSpeedMph(hourlyFallback.windSpeed)
        : 0;

  const condition =
    observation.textDescription?.trim() ||
    hourlyFallback?.shortForecast ||
    "Current conditions";

  return {
    temperatureF,
    condition,
    conditionCode: mapShortForecastToConditionCode(condition),
    feelsLikeF,
    humidityPercent: humidity,
    windMph,
    windDirection: parseWindDirection(
      observation.windDirection?.value,
      hourlyFallback?.windDirection,
    ),
    rainChancePercent: hourlyFallback?.probabilityOfPrecipitation?.value ?? 0,
    heatIndexF: heatIndexC != null ? celsiusToFahrenheit(heatIndexC) : feelsLikeF,
    lastUpdated: toIsoOrNow(observation.timestamp),
  };
}

export function mapHourlyToCurrent(hourly: NwsForecastPeriod): CurrentConditions {
  const temperatureF = hourly.temperature;
  const condition = hourly.shortForecast;

  return {
    temperatureF,
    condition,
    conditionCode: mapShortForecastToConditionCode(condition),
    feelsLikeF: temperatureF,
    humidityPercent: 0,
    windMph: parseWindSpeedMph(hourly.windSpeed),
    windDirection: hourly.windDirection,
    rainChancePercent: hourly.probabilityOfPrecipitation?.value ?? 0,
    heatIndexF: temperatureF,
    lastUpdated: toIsoOrNow(hourly.startTime),
  };
}

export function mapGeocodedPlaceToLocation(place: GeocodedPlace) {
  return {
    label: place.label,
    county: place.county,
    city: place.city,
    state: place.state,
    postalCode: place.postalCode,
  };
}
