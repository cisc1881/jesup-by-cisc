import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertRateLimit } from "@/lib/weather/rate-limit";
import { sendDevelopmentServerPushTest } from "./delivery";
import { runWeatherAlertPollCycle } from "./poller";
import { VapidConfigurationError, getServerVapidConfig } from "./vapid-config";

const TEST_PUSH_RATE = { maxRequests: 3, windowMs: 60_000 };
const POLL_RATE = { maxRequests: 2, windowMs: 60_000 };

function assertDevelopmentOnly(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Development-only Web Push actions are disabled in production.");
  }
}

async function assertAdmin(db: SupabaseClient, userId: string) {
  const { data, error } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Forbidden: admin role required.");
}

export const sendServerPushTestServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertDevelopmentOnly();
    getServerVapidConfig();
    assertRateLimit(
      `weather-push-test:${context.userId}`,
      TEST_PUSH_RATE.maxRequests,
      TEST_PUSH_RATE.windowMs,
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return sendDevelopmentServerPushTest(supabaseAdmin, context.userId);
  });

export const triggerWeatherAlertPollServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    assertDevelopmentOnly();
    getServerVapidConfig();
    await assertAdmin(context.supabase, context.userId);
    assertRateLimit(
      `weather-alert-poll:${context.userId}`,
      POLL_RATE.maxRequests,
      POLL_RATE.windowMs,
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return runWeatherAlertPollCycle(supabaseAdmin, { triggeredBy: context.userId });
  });

export function formatVapidSetupError(error: unknown): string {
  if (error instanceof VapidConfigurationError) return error.message;
  return "Web Push is not configured for development.";
}
