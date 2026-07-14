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
const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) throw new Error("Supabase credentials are required");

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, options);
const anonymous = createClient(url, anonKey, options);
const stamp = Date.now();
const password = `JESUP-QA-${stamp}!`;
const applicantEmail = `jesup-readiness-${stamp}@example.com`;
const reviewerEmail = `jesup-readiness-admin-${stamp}@example.com`;
const ids = {
  users: [],
  event: null,
  program: null,
  internship: null,
  application: null,
  inquiry: null,
  equipment: null,
  checkouts: [],
  news: null,
  market: null,
  partner: null,
};
const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
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
  ids.users.push(data.user.id);
  return data.user;
}

async function signIn(email) {
  const client = createClient(url, anonKey, options);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function cleanup() {
  if (ids.inquiry) await admin.from("inquiries").delete().eq("id", ids.inquiry);
  if (ids.checkouts.length)
    await admin.from("equipment_checkouts").delete().in("id", ids.checkouts);
  if (ids.application)
    await admin.from("internship_applications").delete().eq("id", ids.application);
  for (const [table, id] of [
    ["events", ids.event],
    ["programs", ids.program],
    ["internships", ids.internship],
    ["equipment", ids.equipment],
    ["news_articles", ids.news],
    ["markets", ids.market],
    ["partners", ids.partner],
  ]) {
    if (id) await admin.from(table).delete().eq("id", id);
  }
  await admin.from("email_deliveries").delete().in("recipient", [applicantEmail, reviewerEmail]);
  for (const id of ids.users) await admin.auth.admin.deleteUser(id);
}

try {
  const applicant = await createUser(applicantEmail, "JESUP Readiness Applicant");
  const reviewer = await createUser(reviewerEmail, "JESUP Readiness Administrator");
  const { error: roleError } = await admin
    .from("user_roles")
    .insert({ user_id: reviewer.id, role: "admin" });
  if (roleError) throw roleError;
  const applicantClient = await signIn(applicantEmail);
  const reviewerClient = await signIn(reviewerEmail);

  const startsAt = new Date(Date.now() + 14 * 86400000).toISOString();
  const { data: event, error: eventError } = await reviewerClient
    .from("events")
    .insert({
      title: `JESUP Readiness Event ${stamp}`,
      slug: `jesup-readiness-event-${stamp}`,
      starts_at: startsAt,
      status: "draft",
      is_active: true,
      registration_open: true,
      registration_status: "open",
      capacity: 2,
      metadata: {},
    })
    .select("id")
    .single();
  if (eventError) throw eventError;
  ids.event = event.id;
  const { error: eventPublishError } = await reviewerClient
    .from("events")
    .update({ status: "published", title: `JESUP Readiness Event Published ${stamp}` })
    .eq("id", event.id);
  record(
    "admin can create, edit, and publish an event",
    !eventPublishError,
    eventPublishError?.message,
  );
  const { data: registration, error: registrationError } = await applicantClient.rpc(
    "register_for_event",
    { p_event_id: event.id, p_notes: "Readiness registration" },
  );
  const { data: adminRegistration, error: adminRegistrationError } = await reviewerClient
    .from("event_registrations")
    .select("id,status")
    .eq("event_id", event.id)
    .eq("user_id", applicant.id)
    .single();
  record(
    "event registration appears in Admin",
    !registrationError && !!registration?.length && !adminRegistrationError && !!adminRegistration,
    registrationError?.message ?? adminRegistrationError?.message,
  );

  const { data: program, error: programError } = await reviewerClient
    .from("programs")
    .insert({
      name: `JESUP Readiness Program ${stamp}`,
      slug: `jesup-readiness-program-${stamp}`,
      short: "Temporary readiness program",
      is_active: false,
      metadata: {},
    })
    .select("id")
    .single();
  if (programError) throw programError;
  ids.program = program.id;
  const { error: programPublishError } = await reviewerClient
    .from("programs")
    .update({ is_active: true, tagline: "Published during readiness verification" })
    .eq("id", program.id);
  const { data: publicProgram } = await anonymous
    .from("programs")
    .select("id")
    .eq("id", program.id)
    .maybeSingle();
  record(
    "admin can create, edit, and publish a program",
    !programPublishError && !!publicProgram,
    programPublishError?.message,
  );
  const { data: inquiryId, error: inquiryError } = await applicantClient.rpc(
    "submit_public_inquiry",
    {
      p_first_name: "JESUP",
      p_last_name: "Readiness",
      p_email: applicantEmail,
      p_inquiry_type: "join_program",
      p_consent_contact: true,
      p_preferred_contact: "email",
      p_program_id: program.id,
      p_newsletter_opt_in: false,
      p_user_id: applicant.id,
    },
  );
  ids.inquiry = inquiryId;
  const { data: adminInquiry, error: adminInquiryError } = await reviewerClient
    .from("inquiries")
    .select("id,status,program_id")
    .eq("id", inquiryId)
    .single();
  record(
    "program interest submission appears in Admin",
    !inquiryError && !adminInquiryError && adminInquiry?.program_id === program.id,
    inquiryError?.message ?? adminInquiryError?.message,
  );

  const { data: internship, error: internshipError } = await reviewerClient
    .from("internships")
    .insert({
      title: `JESUP Readiness Internship ${stamp}`,
      slug: `jesup-readiness-internship-${stamp}`,
      description: "Temporary readiness internship",
      is_open: true,
      max_applicants: 2,
    })
    .select("id")
    .single();
  if (internshipError) throw internshipError;
  ids.internship = internship.id;
  const { data: applicationId, error: applicationError } = await applicantClient.rpc(
    "submit_internship_application",
    { p_application: { internship_id: internship.id, cover_letter: "Readiness application" } },
  );
  ids.application = applicationId;
  const { data: reviewed, error: reviewError } = await reviewerClient
    .from("internship_applications")
    .update({ status: "under_review" })
    .eq("id", applicationId)
    .select("id,status")
    .single();
  record(
    "internship submission appears in Admin and can be reviewed",
    !applicationError && !reviewError && reviewed?.status === "under_review",
    applicationError?.message ?? reviewError?.message,
  );

  const { data: equipment, error: equipmentError } = await reviewerClient
    .from("equipment")
    .insert({
      name: `JESUP Readiness Equipment ${stamp}`,
      description: "Temporary readiness inventory",
      category: "QA",
      quantity_total: 1,
    })
    .select("id")
    .single();
  if (equipmentError) throw equipmentError;
  ids.equipment = equipment.id;
  const checkoutDate = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
  const returnDate = new Date(Date.now() + 22 * 86400000).toISOString().slice(0, 10);
  const { data: checkout, error: checkoutError } = await applicantClient
    .from("equipment_checkouts")
    .insert({
      equipment_id: equipment.id,
      user_id: applicant.id,
      quantity: 1,
      checkout_date: checkoutDate,
      return_date: returnDate,
      status: "pending",
      notes: "Readiness request",
    })
    .select("id")
    .single();
  if (checkout?.id) ids.checkouts.push(checkout.id);
  const { data: approved, error: approveError } = await reviewerClient
    .from("equipment_checkouts")
    .update({ status: "approved" })
    .eq("id", checkout?.id)
    .select("id,status")
    .single();
  record(
    "equipment request appears in Admin and can be approved",
    !checkoutError && !approveError && approved?.status === "approved",
    checkoutError?.message ?? approveError?.message,
  );
  const { data: overbook, error: overbookError } = await applicantClient
    .from("equipment_checkouts")
    .insert({
      equipment_id: equipment.id,
      user_id: applicant.id,
      quantity: 1,
      checkout_date: checkoutDate,
      return_date: returnDate,
      status: "pending",
      notes: "Expected capacity rejection",
    })
    .select("id")
    .maybeSingle();
  if (overbook?.id) ids.checkouts.push(overbook.id);
  record(
    "equipment availability is enforced by the backend",
    !!overbookError,
    overbookError?.message ?? "over-capacity request was accepted",
  );

  const publishCases = [
    [
      "news_articles",
      {
        title: `JESUP Readiness News ${stamp}`,
        slug: `jesup-readiness-news-${stamp}`,
        summary: "Temporary readiness story",
        is_published: false,
      },
      { is_published: true, published_at: new Date().toISOString() },
      "news",
    ],
    [
      "markets",
      {
        name: `JESUP Readiness Market ${stamp}`,
        slug: `jesup-readiness-market-${stamp}`,
        accepts_snap_ebt: false,
        metadata: {},
        is_active: false,
      },
      { is_active: true, accepts_snap_ebt: true },
      "market",
    ],
    [
      "partners",
      {
        name: `JESUP Readiness Partner ${stamp}`,
        slug: `jesup-readiness-partner-${stamp}`,
        is_published: false,
        partnership_areas: [],
        social_links: {},
      },
      { is_published: true, short_description: "Published during readiness verification" },
      "partner",
    ],
  ];
  for (const [table, create, update, key] of publishCases) {
    const { data: row, error } = await reviewerClient
      .from(table)
      .insert(create)
      .select("id")
      .single();
    if (error) throw error;
    ids[key] = row.id;
    const { error: updateError } = await reviewerClient.from(table).update(update).eq("id", row.id);
    const { data: publicRow } = await anonymous
      .from(table)
      .select("id")
      .eq("id", row.id)
      .maybeSingle();
    record(
      `admin can create, edit, and publish ${key}`,
      !updateError && !!publicRow,
      updateError?.message,
    );
  }

  const { error: unauthorizedWrite } = await applicantClient
    .from("programs")
    .insert({ name: "Unauthorized", slug: `unauthorized-${stamp}`, metadata: {} });
  record("non-admin users cannot publish content", !!unauthorizedWrite, unauthorizedWrite?.message);
  const { data: anonymousInquiries, error: anonymousInquiryError } = await anonymous
    .from("inquiries")
    .select("id")
    .eq("id", inquiryId);
  record(
    "anonymous users cannot read inquiry records",
    !!anonymousInquiryError || anonymousInquiries?.length === 0,
    anonymousInquiryError?.message,
  );

  const { data: notifications, error: notificationError } = await applicantClient
    .from("notifications")
    .select("title")
    .eq("audience", "user");
  const titles = new Set((notifications ?? []).map((item) => item.title));
  record(
    "user confirmations and status notifications are visible",
    !notificationError &&
      titles.has("Event registration confirmed") &&
      titles.has("Application received") &&
      titles.has("Application status updated") &&
      titles.has("Inquiry received"),
    notificationError?.message ?? `${titles.size} titles`,
  );
  const { data: emails, error: emailError } = await admin
    .from("email_deliveries")
    .select("id,status,subject")
    .eq("recipient", applicantEmail);
  record(
    "participant confirmation emails are queued",
    !emailError && (emails ?? []).length >= 4,
    emailError?.message ?? `queued=${emails?.length ?? 0}`,
  );
} finally {
  await cleanup();
}

const failures = results.filter((result) => !result.pass);
console.log(`\nSummary: ${results.length - failures.length} pass, ${failures.length} fail`);
process.exitCode = failures.length ? 1 : 0;
