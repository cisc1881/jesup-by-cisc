#!/usr/bin/env tsx
/**
 * Manual development poll cycle for weather alert delivery.
 * Usage: npm run poll:weather-alerts
 */
import { createClient } from "@supabase/supabase-js";
import { runWeatherAlertPollCycle } from "../src/lib/weather-notifications/poller";
import { getServerVapidConfig } from "../src/lib/weather-notifications/vapid-config";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main() {
  getServerVapidConfig();

  const supabase = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const result = await runWeatherAlertPollCycle(supabase);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
