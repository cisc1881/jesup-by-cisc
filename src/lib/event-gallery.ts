import { supabase } from "@/integrations/supabase/client";
import { EVENT_IMAGES_BUCKET, uploadEventImage } from "@/lib/events";

export type GallerySource = "admin" | "participant";
export type GallerySubmissionStatus = "pending" | "approved" | "rejected";

export const GALLERY_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const GALLERY_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const GALLERY_SUBMISSION_STATUS_LABELS: Record<GallerySubmissionStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Not approved",
};

export const PHOTO_RELEASE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "obtained", label: "Release obtained" },
  { value: "not_required", label: "Release not required" },
  { value: "pending", label: "Release pending" },
] as const;

export type EventGalleryItem = {
  id: string;
  eventId: string;
  imageUrl: string;
  caption: string | null;
  altText: string | null;
  sortOrder: number;
  isCover: boolean;
  isPublicApproved: boolean;
  photographerOrSource: string | null;
  photoReleaseStatus: string | null;
  uploadedBy: string | null;
  source: GallerySource;
  createdAt: string;
};

export type GallerySubmission = {
  id: string;
  eventId: string;
  userId: string;
  imageUrl: string;
  caption: string | null;
  altText: string | null;
  hasPermissionConfirmed: boolean;
  status: GallerySubmissionStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  galleryId: string | null;
  createdAt: string;
  updatedAt: string;
  submitterName: string | null;
  submitterEmail: string | null;
  eventTitle: string | null;
};

export type GallerySubmissionInput = {
  eventId: string;
  imageUrl: string;
  caption?: string | null;
  altText?: string | null;
  hasPermissionConfirmed: boolean;
};

export type GalleryItemUpdate = {
  caption?: string | null;
  altText?: string | null;
  photographerOrSource?: string | null;
  photoReleaseStatus?: string | null;
  isPublicApproved?: boolean;
};

export type EventGallerySummary = {
  totalImages: number;
  approvedImages: number;
  pendingSubmissions: number;
  rejectedSubmissions: number;
  coverImageId: string | null;
};

export type BulkUploadResult = {
  succeeded: EventGalleryItem[];
  failures: { fileName: string; error: string }[];
};

type GalleryRow = {
  id: string;
  event_id: string;
  image_url: string;
  caption: string | null;
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
  is_public_approved: boolean;
  photographer_or_source: string | null;
  photo_release_status: string | null;
  uploaded_by: string | null;
  source: string;
  created_at: string;
};

type SubmissionRow = {
  id: string;
  event_id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  alt_text: string | null;
  has_permission_confirmed: boolean;
  status: GallerySubmissionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  gallery_id: string | null;
  created_at: string;
  updated_at: string;
  events?: { title: string } | null;
};

function mapGalleryRow(row: GalleryRow): EventGalleryItem {
  return {
    id: row.id,
    eventId: row.event_id,
    imageUrl: row.image_url,
    caption: row.caption,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    isCover: row.is_cover,
    isPublicApproved: row.is_public_approved,
    photographerOrSource: row.photographer_or_source,
    photoReleaseStatus: row.photo_release_status,
    uploadedBy: row.uploaded_by,
    source: (row.source as GallerySource) ?? "admin",
    createdAt: row.created_at,
  };
}

export function validateGalleryFile(file: File): string | null {
  if (!GALLERY_ALLOWED_MIME_TYPES.includes(file.type as (typeof GALLERY_ALLOWED_MIME_TYPES)[number])) {
    return "Only JPEG, PNG, WebP, and GIF images are supported.";
  }
  if (file.size > GALLERY_MAX_FILE_BYTES) {
    return `Image must be ${GALLERY_MAX_FILE_BYTES / (1024 * 1024)} MB or smaller.`;
  }
  return null;
}

export function sortGalleryForDisplay(items: EventGalleryItem[]): EventGalleryItem[] {
  return [...items].sort((a, b) => {
    if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
}

export function galleryImageAlt(item: Pick<EventGalleryItem, "altText" | "caption">): string {
  return item.altText?.trim() || item.caption?.trim() || "Event photo";
}

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("You must be signed in.");
  return data.user.id;
}

async function fetchSubmitterProfiles(userIds: string[]) {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return new Map<string, { full_name: string | null; email: string | null }>();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", unique);
  if (error) throw error;
  return new Map(
    (data ?? []).map((p) => [p.id, { full_name: p.full_name, email: p.email }]),
  );
}

export async function listEventGallery(
  eventId: string,
  options?: { includeUnapproved?: boolean },
): Promise<EventGalleryItem[]> {
  let query = supabase
    .from("event_gallery")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order");

  if (options?.includeUnapproved === false) {
    query = query.eq("is_public_approved", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return sortGalleryForDisplay((data ?? []).map((row) => mapGalleryRow(row as GalleryRow)));
}

export async function listApprovedEventGallery(eventId: string): Promise<EventGalleryItem[]> {
  return listEventGallery(eventId, { includeUnapproved: false });
}

export async function uploadAdminEventImages(
  eventId: string,
  files: File[],
  options?: {
    onProgress?: (completed: number, total: number) => void;
  },
): Promise<BulkUploadResult> {
  const succeeded: EventGalleryItem[] = [];
  const failures: { fileName: string; error: string }[] = [];

  const existing = await listEventGallery(eventId);
  let hasCover = existing.some((item) => item.isCover);
  let nextSort = existing.length > 0 ? Math.max(...existing.map((i) => i.sortOrder)) + 1 : 0;

  const userId = await getCurrentUserId();

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const validationError = validateGalleryFile(file);
    if (validationError) {
      failures.push({ fileName: file.name, error: validationError });
      options?.onProgress?.(index + 1, files.length);
      continue;
    }

    try {
      const url = await uploadEventImage(file, `gallery/${eventId}`);
      const makeCover = !hasCover && succeeded.length === 0;

      const { data, error } = await supabase
        .from("event_gallery")
        .insert({
          event_id: eventId,
          image_url: url,
          caption: null,
          alt_text: null,
          sort_order: nextSort,
          is_cover: makeCover,
          is_public_approved: true,
          photographer_or_source: "admin",
          photo_release_status: "not_required",
          uploaded_by: userId,
          source: "admin",
        })
        .select("*")
        .single();

      if (error) throw error;
      succeeded.push(mapGalleryRow(data as GalleryRow));
      if (makeCover) hasCover = true;
      nextSort += 1;
    } catch (err) {
      failures.push({
        fileName: file.name,
        error: err instanceof Error ? err.message : "Upload failed",
      });
    }

    options?.onProgress?.(index + 1, files.length);
  }

  return { succeeded, failures };
}

export async function updateEventGalleryItem(
  itemId: string,
  updates: GalleryItemUpdate,
): Promise<EventGalleryItem> {
  const payload: Record<string, unknown> = {};
  if (updates.caption !== undefined) payload.caption = updates.caption;
  if (updates.altText !== undefined) payload.alt_text = updates.altText;
  if (updates.photographerOrSource !== undefined) payload.photographer_or_source = updates.photographerOrSource;
  if (updates.photoReleaseStatus !== undefined) payload.photo_release_status = updates.photoReleaseStatus;
  if (updates.isPublicApproved !== undefined) payload.is_public_approved = updates.isPublicApproved;

  const { data, error } = await supabase
    .from("event_gallery")
    .update(payload)
    .eq("id", itemId)
    .select("*")
    .single();

  if (error) throw error;
  return mapGalleryRow(data as GalleryRow);
}

export async function deleteEventGalleryItem(itemId: string, eventId: string): Promise<void> {
  const { data: item, error: fetchError } = await supabase
    .from("event_gallery")
    .select("id, is_cover")
    .eq("id", itemId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!item) throw new Error("Gallery image not found.");

  const { error } = await supabase.from("event_gallery").delete().eq("id", itemId);
  if (error) throw error;

  if (item.is_cover) {
    const remaining = await listEventGallery(eventId, { includeUnapproved: false });
    const nextCover = remaining.find((row) => row.isPublicApproved);
    if (nextCover) {
      await setEventCoverImage(eventId, nextCover.id);
    }
  }
}

export async function setEventCoverImage(eventId: string, itemId: string): Promise<EventGalleryItem> {
  const { error: clearError } = await supabase
    .from("event_gallery")
    .update({ is_cover: false })
    .eq("event_id", eventId)
    .eq("is_cover", true);

  if (clearError) throw clearError;

  const { data, error } = await supabase
    .from("event_gallery")
    .update({ is_cover: true, is_public_approved: true })
    .eq("id", itemId)
    .eq("event_id", eventId)
    .select("*")
    .single();

  if (error) throw error;
  return mapGalleryRow(data as GalleryRow);
}

export async function reorderEventGallery(eventId: string, orderedIds: string[]): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("event_gallery")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("event_id", eventId),
  );

  const results = await Promise.all(updates);
  for (const res of results) {
    if (res.error) throw res.error;
  }
}

export async function listPendingGallerySubmissions(eventId?: string): Promise<GallerySubmission[]> {
  let query = supabase
    .from("event_gallery_submissions")
    .select("*, events ( title )")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as SubmissionRow[];
  const profileMap = await fetchSubmitterProfiles(rows.map((r) => r.user_id));

  return rows.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      imageUrl: row.image_url,
      caption: row.caption,
      altText: row.alt_text,
      hasPermissionConfirmed: row.has_permission_confirmed,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      galleryId: row.gallery_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      submitterName: profile?.full_name ?? null,
      submitterEmail: profile?.email ?? null,
      eventTitle: row.events?.title ?? null,
    };
  });
}

export async function listGallerySubmissions(options?: {
  eventId?: string;
  status?: GallerySubmissionStatus | "all";
}): Promise<GallerySubmission[]> {
  let query = supabase
    .from("event_gallery_submissions")
    .select("*, events ( title )")
    .order("created_at", { ascending: false });

  if (options?.eventId) query = query.eq("event_id", options.eventId);
  if (options?.status && options.status !== "all") query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as SubmissionRow[];
  const profileMap = await fetchSubmitterProfiles(rows.map((r) => r.user_id));

  return rows.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      eventId: row.event_id,
      userId: row.user_id,
      imageUrl: row.image_url,
      caption: row.caption,
      altText: row.alt_text,
      hasPermissionConfirmed: row.has_permission_confirmed,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      galleryId: row.gallery_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      submitterName: profile?.full_name ?? null,
      submitterEmail: profile?.email ?? null,
      eventTitle: row.events?.title ?? null,
    };
  });
}

export async function uploadParticipantEventImage(
  eventId: string,
  file: File,
): Promise<string> {
  const validationError = validateGalleryFile(file);
  if (validationError) throw new Error(validationError);

  const userId = await getCurrentUserId();
  const path = `submissions/${userId}/${eventId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from(EVENT_IMAGES_BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function submitParticipantEventPhoto(input: GallerySubmissionInput): Promise<GallerySubmission> {
  if (!input.hasPermissionConfirmed) {
    throw new Error("Permission confirmation is required.");
  }

  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("event_gallery_submissions")
    .insert({
      event_id: input.eventId,
      user_id: userId,
      image_url: input.imageUrl,
      caption: input.caption?.trim() || null,
      alt_text: input.altText?.trim() || null,
      has_permission_confirmed: true,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw error;
  const row = data as SubmissionRow;
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    imageUrl: row.image_url,
    caption: row.caption,
    altText: row.alt_text,
    hasPermissionConfirmed: row.has_permission_confirmed,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    galleryId: row.gallery_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submitterName: null,
    submitterEmail: null,
    eventTitle: null,
  };
}

export async function listMyGallerySubmissions(userId: string): Promise<GallerySubmission[]> {
  const { data, error } = await supabase
    .from("event_gallery_submissions")
    .select("*, events ( title )")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as SubmissionRow[]).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    imageUrl: row.image_url,
    caption: row.caption,
    altText: row.alt_text,
    hasPermissionConfirmed: row.has_permission_confirmed,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    galleryId: row.gallery_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submitterName: null,
    submitterEmail: null,
    eventTitle: row.events?.title ?? null,
  }));
}

async function createGalleryItemFromSubmission(
  submission: SubmissionRow,
  reviewerId: string,
  overrides?: { caption?: string | null; altText?: string | null },
): Promise<EventGalleryItem> {
  const existing = await listEventGallery(submission.event_id);
  const nextSort = existing.length > 0 ? Math.max(...existing.map((i) => i.sortOrder)) + 1 : 0;

  const { data: galleryRow, error: galleryError } = await supabase
    .from("event_gallery")
    .insert({
      event_id: submission.event_id,
      image_url: submission.image_url,
      caption: overrides?.caption ?? submission.caption,
      alt_text: overrides?.altText ?? submission.alt_text,
      sort_order: nextSort,
      is_cover: false,
      is_public_approved: true,
      photographer_or_source: "participant",
      photo_release_status: "obtained",
      uploaded_by: submission.user_id,
      source: "participant",
    })
    .select("*")
    .single();

  if (galleryError) throw galleryError;

  const { error: submissionError } = await supabase
    .from("event_gallery_submissions")
    .update({
      status: "approved",
      gallery_id: galleryRow.id,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      caption: overrides?.caption ?? submission.caption,
      alt_text: overrides?.altText ?? submission.alt_text,
    })
    .eq("id", submission.id);

  if (submissionError) throw submissionError;

  return mapGalleryRow(galleryRow as GalleryRow);
}

export async function approveGallerySubmission(
  submissionId: string,
  overrides?: { caption?: string | null; altText?: string | null },
): Promise<EventGalleryItem> {
  const reviewerId = await getCurrentUserId();

  const { data: submission, error } = await supabase
    .from("event_gallery_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (error) throw error;
  if (!submission) throw new Error("Submission not found.");
  if (submission.status !== "pending") throw new Error("Only pending submissions can be approved.");

  return createGalleryItemFromSubmission(submission as SubmissionRow, reviewerId, overrides);
}

export async function rejectGallerySubmission(submissionId: string): Promise<void> {
  const reviewerId = await getCurrentUserId();
  const { error } = await supabase
    .from("event_gallery_submissions")
    .update({
      status: "rejected",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .eq("status", "pending");

  if (error) throw error;
}

export async function convertSubmissionToGalleryItem(
  submissionId: string,
  overrides?: { caption?: string | null; altText?: string | null },
): Promise<EventGalleryItem> {
  return approveGallerySubmission(submissionId, overrides);
}

export async function getEventGallerySummary(eventId: string): Promise<EventGallerySummary> {
  const [gallery, pendingRes, rejectedRes, coverRes] = await Promise.all([
    listEventGallery(eventId),
    supabase
      .from("event_gallery_submissions")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "pending"),
    supabase
      .from("event_gallery_submissions")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "rejected"),
    supabase
      .from("event_gallery")
      .select("id")
      .eq("event_id", eventId)
      .eq("is_cover", true)
      .maybeSingle(),
  ]);

  if (pendingRes.error) throw pendingRes.error;
  if (rejectedRes.error) throw rejectedRes.error;
  if (coverRes.error) throw coverRes.error;

  return {
    totalImages: gallery.length,
    approvedImages: gallery.filter((item) => item.isPublicApproved).length,
    pendingSubmissions: pendingRes.count ?? 0,
    rejectedSubmissions: rejectedRes.count ?? 0,
    coverImageId: coverRes.data?.id ?? null,
  };
}

export async function fetchEventGalleryHeader(eventId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, starts_at, image_url")
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Event not found.");
  return {
    id: data.id,
    title: data.title,
    startsAt: data.starts_at,
    coverImageUrl: data.image_url,
  };
}
