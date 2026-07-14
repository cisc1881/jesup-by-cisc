#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!match) continue;
  let value = match[2].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  )
    value = value.slice(1, -1);
  process.env[match[1]] ??= value.trim();
}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error("Supabase service credentials are required");

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const subject = `[JESUP QA] Production email delivery verification ${new Date().toISOString()}`;
const { data: delivery, error: insertError } = await supabase
  .from("email_deliveries")
  .insert({
    recipient: "cisc@tuskegee.edu",
    subject,
    body: "This automated message verifies that JESUP production notifications can reach the official CISC mailbox.",
    action_url: "/admin/email-deliveries",
  })
  .select("id")
  .single();
if (insertError) throw insertError;

const { data: workerResult, error: invokeError } = await supabase.functions.invoke(
  "process-email-queue",
  { body: {} },
);
if (invokeError) throw invokeError;

let final;
for (let attempt = 0; attempt < 10; attempt += 1) {
  const { data, error } = await supabase
    .from("email_deliveries")
    .select("status, attempts, provider_message_id, last_error, sent_at")
    .eq("id", delivery.id)
    .single();
  if (error) throw error;
  final = data;
  if (data.status === "sent" || data.status === "failed") break;
  await new Promise((resolve) => setTimeout(resolve, 500));
}

console.log(JSON.stringify({ deliveryId: delivery.id, subject, workerResult, ...final }, null, 2));
if (final?.status !== "sent") process.exitCode = 1;
