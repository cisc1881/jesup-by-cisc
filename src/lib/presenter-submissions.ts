/** Per-conference presenter submissions: shared types and pure helpers. */

export const PRESENTER_FILE_KINDS = ["proposal", "slides", "material"] as const;
export type PresenterFileKind = (typeof PRESENTER_FILE_KINDS)[number];

export const PRESENTER_KIND_LABELS: Record<PresenterFileKind, string> = {
  proposal: "Proposal / abstract",
  slides: "Presentation slides",
  material: "Supporting materials",
};

export const PRESENTER_TYPES = ["student", "faculty"] as const;
export type PresenterType = (typeof PRESENTER_TYPES)[number];

export const PRESENTER_FILES_BUCKET = "presenter-files";

export const PRESENTER_MIME_OPTIONS = [
  { mime: "application/pdf", label: "PDF" },
  {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    label: "PowerPoint (.pptx)",
  },
  { mime: "application/vnd.ms-powerpoint", label: "PowerPoint 97-2003 (.ppt)" },
  {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    label: "Word (.docx)",
  },
] as const;

export const DEFAULT_PRESENTER_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
];

export const DEFAULT_MAX_FILE_BYTES = 25 * 1024 * 1024;

export type PresenterSettings = {
  eventId: string;
  enabled: boolean;
  opensAt: string | null;
  closesAt: string | null;
  allowedMimeTypes: string[];
  maxFileBytes: number;
  instructions: string | null;
};

export type SubmissionWindowStatus = "disabled" | "not-open" | "open" | "closed";

/** Server mirrors this in public.presenter_submissions_open; keep logic identical. */
export function submissionWindowStatus(
  settings: Pick<PresenterSettings, "enabled" | "opensAt" | "closesAt"> | null | undefined,
  now: Date = new Date(),
): SubmissionWindowStatus {
  if (!settings || !settings.enabled) return "disabled";
  const nowMs = now.getTime();
  if (settings.opensAt && new Date(settings.opensAt).getTime() > nowMs) return "not-open";
  if (settings.closesAt && new Date(settings.closesAt).getTime() <= nowMs) return "closed";
  return "open";
}

export function validatePresenterFile(
  file: { name: string; size: number; type: string },
  settings: Pick<PresenterSettings, "allowedMimeTypes" | "maxFileBytes">,
): string | null {
  if (!settings.allowedMimeTypes.includes(file.type)) {
    return "This file type is not accepted for this event.";
  }
  if (file.size < 1) return "The file appears to be empty.";
  if (file.size > settings.maxFileBytes) {
    return `File must be ${Math.round(settings.maxFileBytes / (1024 * 1024))} MB or smaller.`;
  }
  return null;
}

export function safeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.length > 0 ? cleaned : "file";
}

/** Storage path convention; the database enforces the same prefix on submit. */
export function presenterFilePath(eventId: string, presenterId: string, fileName: string): string {
  return `${eventId}/${presenterId}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
