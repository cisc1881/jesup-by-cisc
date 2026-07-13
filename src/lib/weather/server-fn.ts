import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  GEOCODE_MIN_QUERY_LENGTH,
  GEOCODE_RATE_LIMIT,
  WEATHER_FETCH_RATE_LIMIT,
} from "./constants";
import { assertRateLimit } from "./rate-limit";
import { geocodeManualLocation, getWeatherCenterData } from "./service";

const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

const geocodeSchema = z.object({
  query: z
    .string()
    .trim()
    .min(GEOCODE_MIN_QUERY_LENGTH)
    .max(120),
});

export const fetchWeatherCenterServerFn = createServerFn({ method: "POST" })
  .validator(coordinatesSchema)
  .handler(async ({ data }) => {
    assertRateLimit(
      `weather:${data.lat.toFixed(2)}:${data.lon.toFixed(2)}`,
      WEATHER_FETCH_RATE_LIMIT.maxRequests,
      WEATHER_FETCH_RATE_LIMIT.windowMs,
    );
    return getWeatherCenterData(data.lat, data.lon);
  });

export const geocodeLocationServerFn = createServerFn({ method: "POST" })
  .validator(geocodeSchema)
  .handler(async ({ data }) => {
    const normalized = data.query.trim().toLowerCase();
    assertRateLimit(
      `geocode:${normalized}`,
      GEOCODE_RATE_LIMIT.maxRequests,
      GEOCODE_RATE_LIMIT.windowMs,
    );
    return geocodeManualLocation(data.query);
  });
