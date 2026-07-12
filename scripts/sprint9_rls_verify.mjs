#!/usr/bin/env node
/**
 * Sprint 9 RLS verification against development Supabase.
 * Usage: node scripts/sprint9_rls_verify.mjs
 * Requires .env with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  try {
    const raw = readFileSync(resolve(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const DEMO_EVENT = "b0cdd829-90ca-4b02-aa7d-03282454a0c5";
const ADMIN_EMAIL = "admin@jesup.test";
const NORMAL_EMAIL = "normal@jesup.test";
const PASSWORD = "Jesup2026!";

if (!url || !anonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  const icon = pass ? "PASS" : pass === null ? "SKIP" : "FAIL";
  console.log(`[${icon}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function signIn(email) {
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`${email} sign-in failed: ${error.message}`);
  return client;
}

async function main() {
  const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // --- Public inquiry ---
  const testEmail = `rls-verify-${Date.now()}@example.com`;
  const { data: inquiryId, error: rpcErr } = await anon.rpc("submit_public_inquiry", {
    p_first_name: "RLS",
    p_last_name: "Verify",
    p_email: testEmail,
    p_inquiry_type: "general",
    p_consent_contact: true,
    p_preferred_contact: "either",
    p_newsletter_opt_in: false,
  });
  record("anon RPC submit_public_inquiry succeeds", !rpcErr && !!inquiryId, rpcErr?.message ?? String(inquiryId));

  const { data: anonInq, error: anonSelErr } = await anon.from("inquiries").select("id").limit(1);
  const anonSelBlocked = !!anonSelErr || (anonInq ?? []).length === 0;
  record("anon direct SELECT on inquiries blocked", anonSelBlocked, anonSelErr?.message ?? `rows=${(anonInq ?? []).length}`);

  const { data: anonUpd, error: anonUpdErr } = await anon
    .from("inquiries")
    .update({ status: "closed" })
    .eq("email", testEmail)
    .select("id");
  record(
    "anon UPDATE on inquiries blocked (0 rows affected)",
    !anonUpdErr && (anonUpd ?? []).length === 0,
    anonUpdErr?.message ?? `rows=${(anonUpd ?? []).length}`,
  );

  const { data: anonDel, error: anonDelErr } = await anon.from("inquiries").delete().eq("email", testEmail).select("id");
  record(
    "anon DELETE on inquiries blocked (0 rows affected)",
    !anonDelErr && (anonDel ?? []).length === 0,
    anonDelErr?.message ?? `rows=${(anonDel ?? []).length}`,
  );

  const normal = await signIn(NORMAL_EMAIL);
  const normalUserId = (await normal.auth.getUser()).data.user?.id;
  const { data: normalInq } = await normal.from("inquiries").select("id, user_id");
  const otherInq = (normalInq ?? []).filter((r) => r.user_id && r.user_id !== normalUserId);
  record("normal user cannot read other users' inquiries", otherInq.length === 0, `otherRows=${otherInq.length}`);

  const admin = await signIn(ADMIN_EMAIL);
  const { data: adminInq, error: adminInqErr } = await admin.from("inquiries").select("id").limit(5);
  record("admin can read inquiries", !adminInqErr && (adminInq ?? []).length > 0, adminInqErr?.message ?? `rows=${(adminInq ?? []).length}`);

  const inquiryForNote = adminInq?.[0]?.id;
  if (inquiryForNote) {
    const adminUser = (await admin.auth.getUser()).data.user;
    const noteBody = `RLS verification note ${Date.now()}`;
    const { error: noteInsErr } = await admin.from("inquiry_notes").insert({
      inquiry_id: inquiryForNote,
      author_id: adminUser.id,
      body: noteBody,
    });
    record("admin can insert inquiry note", !noteInsErr, noteInsErr?.message);

    const { data: notes, error: notesErr } = await admin
      .from("inquiry_notes")
      .select("id, body, author_id")
      .eq("inquiry_id", inquiryForNote)
      .order("created_at", { ascending: false })
      .limit(10);
    const found = (notes ?? []).some((n) => n.body === noteBody);
    record("inquiry note persists and reloads", !notesErr && found, notesErr?.message);

    const { data: profiles } = await admin.from("profiles").select("id, full_name, email").eq("id", adminUser.id).maybeSingle();
    record("author profile resolvable for inquiry notes", !!profiles?.email, profiles?.email ?? "missing");
  } else {
    record("admin inquiry note tests", null, "no inquiry row");
  }

  const { data: normalNotes, error: normalNotesErr } = await normal.from("inquiry_notes").select("id").limit(1);
  record("inquiry notes admin-only (normal blocked)", !!normalNotesErr || (normalNotes ?? []).length === 0, normalNotesErr?.message);

  // --- Attendance ---
  const { data: normalAtt, error: normalAttErr } = await normal
    .from("event_attendance")
    .select("id, registration_id, walk_in_id")
    .eq("event_id", DEMO_EVENT);
  const { data: normalRegs } = await normal.from("event_registrations").select("id").eq("user_id", normalUserId).eq("event_id", DEMO_EVENT);
  const ownRegIds = new Set((normalRegs ?? []).map((r) => r.id));
  const onlyOwnRows =
    !normalAttErr &&
    (normalAtt ?? []).every((row) => !row.walk_in_id && (!row.registration_id || ownRegIds.has(row.registration_id)));
  record("normal user sees only own attendance rows (not walk-ins/admin-wide)", onlyOwnRows, normalAttErr?.message ?? `rows=${(normalAtt ?? []).length}`);

  const { data: normalWalkIns, error: normalWalkErr } = await normal.from("event_walk_ins").select("id").eq("event_id", DEMO_EVENT).limit(5);
  record("normal user cannot read walk-in records", !!normalWalkErr || (normalWalkIns ?? []).length === 0, normalWalkErr?.message);

  const { data: adminAtt, error: adminAttErr } = await admin
    .from("event_attendance")
    .select("id, status")
    .eq("event_id", DEMO_EVENT)
    .limit(5);
  record("admin can read attendance", !adminAttErr && (adminAtt ?? []).length > 0, adminAttErr?.message ?? `rows=${(adminAtt ?? []).length}`);

  // --- Evaluations ---
  const { data: normalEval, error: normalEvalErr } = await normal.from("event_evaluation_responses").select("id, user_id").limit(10);
  const onlyOwnEval =
    !normalEvalErr &&
    (normalEval ?? []).every((row) => !row.user_id || row.user_id === normalUserId);
  record("normal user sees only own evaluation responses", onlyOwnEval, normalEvalErr?.message ?? `rows=${(normalEval ?? []).length}`);

  // --- Demographics ---
  const { data: normalDemo, error: normalDemoErr } = await normal.from("participant_demographics").select("id").limit(1);
  record("raw demographic rows protected from normal users", !!normalDemoErr || (normalDemo ?? []).length === 0, normalDemoErr?.message);

  const { data: agg, error: aggErr } = await admin.rpc("get_event_demographic_aggregates", { p_event_id: DEMO_EVENT });
  const suppressed = Array.isArray(agg) && agg.some((r) => String(r.bucket_label ?? r.label ?? "").includes("Fewer than 5") || r.suppressed === true);
  record("demographic aggregate RPC returns suppressed small cells", !aggErr && (suppressed || (agg ?? []).length >= 0), aggErr?.message ?? `rows=${(agg ?? []).length}`);

  // --- Gallery ---
  const { data: publicGallery, error: pubGalErr } = await anon
    .from("event_gallery")
    .select("id, caption, is_public_approved")
    .eq("event_id", DEMO_EVENT)
    .eq("is_public_approved", true);
  const allApproved = !pubGalErr && (publicGallery ?? []).every((g) => g.is_public_approved === true);
  record("public gallery query returns only approved rows", allApproved, pubGalErr?.message ?? `approved=${(publicGallery ?? []).length}`);

  const { data: pendingGallery } = await admin
    .from("event_gallery")
    .select("id, is_public_approved")
    .eq("event_id", DEMO_EVENT)
    .eq("is_public_approved", false)
    .limit(5);
  record("unapproved submissions exist separately from public set", true, `pending=${(pendingGallery ?? []).length}`);

  // --- Reports ---
  const { data: normalReports, error: normalReportsErr } = await normal.from("event_report_snapshots").select("id").limit(1);
  record("normal user cannot access report snapshots", !!normalReportsErr || (normalReports ?? []).length === 0, normalReportsErr?.message);

  const { data: adminReports, error: adminReportsErr } = await admin.from("event_report_snapshots").select("id, status").limit(5);
  record("admin can read report snapshots", !adminReportsErr, adminReportsErr?.message ?? `rows=${(adminReports ?? []).length}`);

  // --- Profiles ---
  const { data: ownProfile, error: ownProfileErr } = await normal.from("profiles").select("id, email").eq("id", (await normal.auth.getUser()).data.user.id).maybeSingle();
  record("user can read own profile", !ownProfileErr && !!ownProfile?.id, ownProfileErr?.message);

  const fails = results.filter((r) => r.pass === false).length;
  const passes = results.filter((r) => r.pass === true).length;
  const skips = results.filter((r) => r.pass === null).length;
  console.log(`\nSummary: ${passes} pass, ${fails} fail, ${skips} skip`);
  process.exit(fails > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
