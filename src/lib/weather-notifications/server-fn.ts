import { createServerFn } from "@tanstack/react-start";
import { fetchAdminWeatherNotificationSummary } from "./service";

/** Server function for admin weather notification summary (RLS + admin role enforced client-side). */
export const fetchAdminWeatherNotificationSummaryServerFn = createServerFn({ method: "GET" }).handler(
  async () => fetchAdminWeatherNotificationSummary(),
);
