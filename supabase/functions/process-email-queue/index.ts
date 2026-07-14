import { createClient } from "npm:@supabase/supabase-js@2";

const jsonHeaders = { "content-type": "application/json" };

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://jesup.cisc1881.org";
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return new Response(JSON.stringify({ error: "Email delivery is not configured" }), {
      status: 503,
      headers: jsonHeaders,
    });
  }

  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: setting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "email")
    .maybeSingle();
  const fromName = String(setting?.value?.fromName ?? "JESUP");
  const fromAddress = String(
    setting?.value?.fromAddress ?? Deno.env.get("EMAIL_FROM_ADDRESS") ?? "",
  );
  if (!fromAddress) {
    return new Response(JSON.stringify({ error: "A verified sender address is required" }), {
      status: 503,
      headers: jsonHeaders,
    });
  }

  const { data: deliveries, error: claimError } = await supabase.rpc("claim_email_deliveries", {
    p_limit: 25,
  });
  if (claimError) {
    return new Response(JSON.stringify({ error: claimError.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  let sent = 0;
  let failed = 0;
  for (const delivery of deliveries ?? []) {
    const actionUrl = delivery.action_url
      ? new URL(delivery.action_url, siteUrl).toString()
      : siteUrl;
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#231f20;line-height:1.6"><div style="max-width:620px;margin:auto;padding:32px"><h1 style="color:#8b1e2d;font-size:24px">${escapeHtml(delivery.subject)}</h1><p>${escapeHtml(delivery.body).replaceAll("\n", "<br>")}</p><p><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#8b1e2d;color:white;padding:12px 20px;border-radius:999px;text-decoration:none">Open JESUP</a></p><p style="margin-top:32px;color:#6b6464;font-size:13px">JESUP by CISC · Tuskegee University</p></div></body></html>`;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${resendApiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: `${fromName} <${fromAddress}>`,
          to: [delivery.recipient],
          subject: delivery.subject,
          html,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message ?? `Provider returned ${response.status}`);

      await supabase
        .from("email_deliveries")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_message_id: result.id ?? null,
          last_error: null,
        })
        .eq("id", delivery.id);
      sent += 1;
    } catch (error) {
      const attempts = Number(delivery.attempts ?? 1);
      const retryMinutes = Math.min(60, 2 ** attempts * 5);
      await supabase
        .from("email_deliveries")
        .update({
          status: "failed",
          last_error:
            error instanceof Error ? error.message.slice(0, 1000) : "Unknown provider error",
          next_attempt_at: new Date(Date.now() + retryMinutes * 60_000).toISOString(),
        })
        .eq("id", delivery.id);
      failed += 1;
    }
  }

  return new Response(JSON.stringify({ claimed: deliveries?.length ?? 0, sent, failed }), {
    headers: jsonHeaders,
  });
});
