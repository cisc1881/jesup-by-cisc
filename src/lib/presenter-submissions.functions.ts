import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DEFAULT_MAX_FILE_BYTES,
  DEFAULT_PRESENTER_MIME_TYPES,
  PRESENTER_FILES_BUCKET,
  PRESENTER_FILE_KINDS,
  PRESENTER_TYPES,
  presenterFilePath,
  submissionWindowStatus,
  type PresenterSettings,
} from "./presenter-submissions";

const eventIdInput = z.object({ eventId: z.string().uuid() });

type SettingsRow = {
  event_id: string;
  enabled: boolean;
  opens_at: string | null;
  closes_at: string | null;
  allowed_mime_types: string[];
  max_file_bytes: number;
  instructions: string | null;
};

function mapSettings(row: SettingsRow): PresenterSettings {
  return {
    eventId: row.event_id,
    enabled: row.enabled,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    allowedMimeTypes: row.allowed_mime_types,
    maxFileBytes: row.max_file_bytes,
    instructions: row.instructions,
  };
}

async function requireEventStaff(supabase: any, userId: string, eventId: string) {
  const { data, error } = await supabase.rpc("is_event_staff", { p_event_id: eventId });
  if (error) throw error;
  if (!data) throw new Error("Event staff or administrator access required.");
}

async function fetchSettings(supabase: any, eventId: string): Promise<PresenterSettings | null> {
  const { data, error } = await supabase
    .from("event_presenter_settings")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSettings(data as SettingsRow) : null;
}

/** Lightweight access check for menus and route gating. */
export const getPresenterAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(eventIdInput)
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const [staff, presenter] = await Promise.all([
      db.rpc("is_event_staff", { p_event_id: data.eventId }),
      db.rpc("is_event_presenter", { p_event_id: data.eventId }),
    ]);
    if (staff.error) throw staff.error;
    if (presenter.error) throw presenter.error;
    return { isStaff: Boolean(staff.data), isPresenter: Boolean(presenter.data) };
  });

/** Presenter portal: deadline, instructions, and the caller's own submissions. */
export const getPresenterPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(eventIdInput)
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const { data: isPresenter, error: accessError } = await db.rpc("is_event_presenter", {
      p_event_id: data.eventId,
    });
    if (accessError) throw accessError;
    if (!isPresenter) throw new Error("You are not an authorized presenter for this event.");

    const { data: presenter, error: presenterError } = await db
      .from("event_presenters")
      .select("id, presenter_type, session_id, display_name")
      .eq("event_id", data.eventId)
      .eq("user_id", context.userId)
      .single();
    if (presenterError) throw presenterError;

    const settings = await fetchSettings(db, data.eventId);
    const { data: submissions, error: submissionsError } = await db
      .from("event_presenter_submissions")
      .select("id, kind, title, file_name, file_size, mime_type, is_current, created_at")
      .eq("presenter_id", presenter.id)
      .order("created_at", { ascending: false });
    if (submissionsError) throw submissionsError;

    return {
      presenter,
      settings,
      window: submissionWindowStatus(settings),
      submissions: submissions ?? [],
    };
  });

const uploadRequestInput = z.object({
  eventId: z.string().uuid(),
  kind: z.enum(PRESENTER_FILE_KINDS),
  fileName: z.string().trim().min(1).max(240),
  fileSize: z.number().int().min(1),
  mimeType: z.string().trim().min(3).max(120),
});

/** Mints a short-lived signed upload URL after authorization and deadline checks. */
export const requestPresenterUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(uploadRequestInput)
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const { data: presenter, error: presenterError } = await db
      .from("event_presenters")
      .select("id")
      .eq("event_id", data.eventId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (presenterError) throw presenterError;
    if (!presenter) throw new Error("You are not an authorized presenter for this event.");

    const settings = await fetchSettings(db, data.eventId);
    if (submissionWindowStatus(settings) !== "open") {
      throw new Error("Presenter submissions are not open for this event.");
    }
    if (!settings!.allowedMimeTypes.includes(data.mimeType)) {
      throw new Error("This file type is not accepted for this event.");
    }
    if (data.fileSize > settings!.maxFileBytes) {
      throw new Error("File exceeds the allowed size.");
    }

    const path = presenterFilePath(data.eventId, presenter.id, data.fileName);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(PRESENTER_FILES_BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw error;
    return { path: signed.path, token: signed.token };
  });

const confirmInput = z.object({
  eventId: z.string().uuid(),
  kind: z.enum(PRESENTER_FILE_KINDS),
  title: z.string().trim().max(240).default(""),
  filePath: z.string().trim().min(1).max(500),
  fileName: z.string().trim().min(1).max(240),
  fileSize: z.number().int().min(1),
  mimeType: z.string().trim().min(3).max(120),
});

/** Records the uploaded file; the database re-enforces presenter access, window, type, and size. */
export const confirmPresenterUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(confirmInput)
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("submit_presenter_file", {
      p_event_id: data.eventId,
      p_kind: data.kind,
      p_title: data.title,
      p_file_path: data.filePath,
      p_file_name: data.fileName,
      p_file_size: data.fileSize,
      p_mime_type: data.mimeType,
    });
    if (error) throw new Error(error.message);
    return { id };
  });

/** Short-lived signed download URL for the owning presenter or event staff; every access is logged. */
export const getPresenterDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ submissionId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    // RLS only returns this row to the owning presenter or event staff.
    const { data: submission, error } = await db
      .from("event_presenter_submissions")
      .select("id, event_id, file_path")
      .eq("id", data.submissionId)
      .maybeSingle();
    if (error) throw error;
    if (!submission) throw new Error("File not found or not accessible.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from(PRESENTER_FILES_BUCKET)
      .createSignedUrl(submission.file_path, 60);
    if (signError) throw signError;

    await db.from("event_presenter_access_log").insert({
      event_id: submission.event_id,
      submission_id: submission.id,
      actor_id: context.userId,
      action: "download",
    });
    return { url: signed.signedUrl };
  });

const settingsInput = z.object({
  eventId: z.string().uuid(),
  enabled: z.boolean(),
  opensAt: z.string().datetime().nullable(),
  closesAt: z.string().datetime().nullable(),
  allowedMimeTypes: z.array(z.string().trim().min(3).max(120)).min(1),
  maxFileBytes: z.number().int().min(1024).max(25 * 1024 * 1024),
  instructions: z.string().trim().max(4000).nullable(),
});

/** Event staff configure the submission window, allowed types, and size limit. */
export const savePresenterSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(settingsInput)
  .handler(async ({ data, context }) => {
    await requireEventStaff(context.supabase, context.userId, data.eventId);
    const { error } = await context.supabase.from("event_presenter_settings").upsert({
      event_id: data.eventId,
      enabled: data.enabled,
      opens_at: data.opensAt,
      closes_at: data.closesAt,
      allowed_mime_types: data.allowedMimeTypes,
      max_file_bytes: data.maxFileBytes,
      instructions: data.instructions,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { saved: true };
  });

const managePresenterInput = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("upsert"),
    eventId: z.string().uuid(),
    userId: z.string().uuid(),
    presenterType: z.enum(PRESENTER_TYPES),
    sessionId: z.string().uuid().nullable(),
    displayName: z.string().trim().max(160).nullable(),
  }),
  z.object({
    action: z.literal("remove"),
    eventId: z.string().uuid(),
    presenterId: z.string().uuid(),
  }),
]);

/** Event staff grant or revoke presenter access (invite/assignment). */
export const manageEventPresenter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(managePresenterInput)
  .handler(async ({ data, context }) => {
    await requireEventStaff(context.supabase, context.userId, data.eventId);
    if (data.action === "upsert") {
      const { error } = await context.supabase.from("event_presenters").upsert(
        {
          event_id: data.eventId,
          user_id: data.userId,
          presenter_type: data.presenterType,
          session_id: data.sessionId,
          display_name: data.displayName,
          created_by: context.userId,
        },
        { onConflict: "event_id,user_id" },
      );
      if (error) throw error;
    } else {
      const { error } = await context.supabase
        .from("event_presenters")
        .delete()
        .eq("id", data.presenterId)
        .eq("event_id", data.eventId);
      if (error) throw error;
    }
    return { saved: true };
  });

/** Event-scoped staff board: every presenter with their latest files, plus recent access. */
export const getPresenterStaffBoard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(eventIdInput)
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    await requireEventStaff(db, context.userId, data.eventId);

    const [settings, presenters, submissions, sessions, access] = await Promise.all([
      fetchSettings(db, data.eventId),
      db
        .from("event_presenters")
        .select("id, user_id, presenter_type, session_id, display_name, created_at")
        .eq("event_id", data.eventId)
        .order("created_at"),
      db
        .from("event_presenter_submissions")
        .select("id, presenter_id, kind, title, file_name, file_size, mime_type, is_current, created_at")
        .eq("event_id", data.eventId)
        .order("created_at", { ascending: false }),
      db.from("event_sessions").select("id, title, starts_at").eq("event_id", data.eventId),
      db
        .from("event_presenter_access_log")
        .select("id, submission_id, actor_id, action, created_at")
        .eq("event_id", data.eventId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    for (const result of [presenters, submissions, sessions, access]) {
      if (result.error) throw result.error;
    }

    const userIds = [...new Set((presenters.data ?? []).map((p: any) => p.user_id))];
    const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
    if (userIds.length > 0) {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      for (const profile of profiles ?? []) {
        profileMap.set(profile.id, { full_name: profile.full_name, email: profile.email });
      }
    }

    return {
      settings,
      window: submissionWindowStatus(settings),
      presenters: (presenters.data ?? []).map((p: any) => ({
        ...p,
        profile: profileMap.get(p.user_id) ?? null,
      })),
      submissions: submissions.data ?? [],
      sessions: sessions.data ?? [],
      access: access.data ?? [],
    };
  });
