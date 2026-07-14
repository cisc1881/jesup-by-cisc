#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator);
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey)
  throw new Error("Supabase URL, publishable key, and service role key are required");

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const stamp = Date.now();
const password = `Jesup-QA-${stamp}!`;
const applicantEmail = `jesup-qa-applicant-${stamp}@example.com`;
const reviewerEmail = `jesup-qa-admin-${stamp}@example.com`;
const created = { users: [], eventId: null, internshipId: null, inquiryId: null };
const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass });
  console.log(`[${pass ? "PASS" : "FAIL"}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function createUser(email, fullName) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw error;
  created.users.push(data.user.id);
  return data.user;
}

async function signIn(email) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function cleanup() {
  if (created.inquiryId) await admin.from("inquiries").delete().eq("id", created.inquiryId);
  if (created.eventId) await admin.from("events").delete().eq("id", created.eventId);
  if (created.internshipId) await admin.from("internships").delete().eq("id", created.internshipId);
  await admin.from("email_deliveries").delete().in("recipient", [applicantEmail, reviewerEmail]);
  for (const userId of created.users) await admin.auth.admin.deleteUser(userId);
}

async function main() {
  try {
    const [applicant, reviewer] = await Promise.all([
      createUser(applicantEmail, "JESUP QA Applicant"),
      createUser(reviewerEmail, "JESUP QA Reviewer"),
    ]);
    const { error: roleError } = await admin
      .from("user_roles")
      .insert({ user_id: reviewer.id, role: "admin" });
    if (roleError) throw roleError;

    const applicantClient = await signIn(applicantEmail);
    const reviewerClient = await signIn(reviewerEmail);
    record("temporary applicant and administrator can sign in", true);

    const startsAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const endsAt = new Date(Date.now() + 7 * 86_400_000 + 7_200_000).toISOString();
    const { data: event, error: eventError } = await admin
      .from("events")
      .insert({
        title: `JESUP QA Event ${stamp}`,
        slug: `jesup-qa-event-${stamp}`,
        starts_at: startsAt,
        ends_at: endsAt,
        status: "published",
        is_active: true,
        registration_open: true,
        registration_status: "open",
        capacity: 1,
      })
      .select("id")
      .single();
    if (eventError) throw eventError;
    created.eventId = event.id;

    const { data: registration, error: registrationError } = await applicantClient.rpc(
      "register_for_event",
      {
        p_event_id: event.id,
        p_notes: "Native QA registration",
      },
    );
    record(
      "applicant can register natively for a published event",
      !registrationError && registration?.length === 1,
      registrationError?.message,
    );

    const { error: duplicateRegistrationError } = await applicantClient.rpc("register_for_event", {
      p_event_id: event.id,
    });
    record(
      "duplicate event registration is rejected",
      duplicateRegistrationError?.message.includes("already registered") === true,
      duplicateRegistrationError?.message,
    );

    const { data: internship, error: internshipError } = await admin
      .from("internships")
      .insert({
        title: `JESUP QA Internship ${stamp}`,
        slug: `jesup-qa-internship-${stamp}`,
        description: "Temporary native workflow verification",
        is_open: true,
        max_applicants: 1,
      })
      .select("id")
      .single();
    if (internshipError) throw internshipError;
    created.internshipId = internship.id;

    const { data: applicationId, error: applicationError } = await applicantClient.rpc(
      "submit_internship_application",
      {
        p_application: { internship_id: internship.id, cover_letter: "Native QA application" },
      },
    );
    record(
      "applicant can submit an internship application natively",
      !applicationError && !!applicationId,
      applicationError?.message,
    );

    const { error: duplicateApplicationError } = await applicantClient.rpc(
      "submit_internship_application",
      {
        p_application: { internship_id: internship.id },
      },
    );
    record(
      "duplicate internship application is rejected",
      duplicateApplicationError?.message.includes("already applied") === true,
      duplicateApplicationError?.message,
    );

    const { data: inquiryId, error: inquiryError } = await applicantClient.rpc(
      "submit_public_inquiry",
      {
        p_first_name: "JESUP",
        p_last_name: "QA",
        p_email: applicantEmail,
        p_inquiry_type: "general",
        p_consent_contact: true,
        p_preferred_contact: "email",
        p_newsletter_opt_in: false,
        p_user_id: applicant.id,
      },
    );
    created.inquiryId = inquiryId;
    record(
      "signed-in applicant can submit an in-app inquiry",
      !inquiryError && !!inquiryId,
      inquiryError?.message,
    );

    const { data: ownActivity, error: ownActivityError } = await applicantClient
      .from("internship_applications")
      .select("id, status")
      .eq("id", applicationId)
      .single();
    record(
      "applicant can read their own application",
      !ownActivityError && ownActivity?.status === "pending",
      ownActivityError?.message,
    );

    const { data: adminApplication, error: adminApplicationError } = await reviewerClient
      .from("internship_applications")
      .update({ status: "under_review" })
      .eq("id", applicationId)
      .select("id")
      .single();
    record(
      "administrator can review and update an application",
      !adminApplicationError && !!adminApplication,
      adminApplicationError?.message,
    );

    const { data: userNotifications, error: notificationError } = await applicantClient
      .from("notifications")
      .select("title, entity_type")
      .eq("audience", "user");
    const notificationTitles = new Set((userNotifications ?? []).map((item) => item.title));
    record(
      "participant confirmations and status updates are visible",
      !notificationError &&
        notificationTitles.has("Event registration confirmed") &&
        notificationTitles.has("Application received") &&
        notificationTitles.has("Application status updated") &&
        notificationTitles.has("Inquiry received"),
      notificationError?.message ?? `${notificationTitles.size} notification titles`,
    );

    const { data: queuedEmails, error: queueError } = await admin
      .from("email_deliveries")
      .select("subject, status")
      .eq("recipient", applicantEmail);
    record(
      "confirmation emails are durably queued",
      !queueError && (queuedEmails ?? []).length >= 4,
      queueError?.message ?? `queued=${queuedEmails?.length ?? 0}`,
    );
  } finally {
    await cleanup();
  }

  const failures = results.filter((result) => !result.pass);
  console.log(`\nSummary: ${results.length - failures.length} pass, ${failures.length} fail`);
  process.exitCode = failures.length ? 1 : 0;
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await cleanup();
  process.exit(1);
});
