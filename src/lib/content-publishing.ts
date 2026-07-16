const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateContentIdentity(kind: string, value: string, slug: string) {
  if (!value.trim()) throw new Error(`${kind} name is required`);
  if (!slug.trim()) throw new Error(`${kind} URL slug is required`);
  if (!SLUG_PATTERN.test(slug.trim())) {
    throw new Error(`${kind} URL slug may contain only lowercase letters, numbers, and hyphens`);
  }
}

export function validateEventSchedule(startsAt: string, endsAt: string) {
  if (!startsAt) throw new Error("Event start date and time are required");
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) throw new Error("Event start date is invalid");
  if (!endsAt) return;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) throw new Error("Event end date is invalid");
  if (end < start) throw new Error("Event end date must be after its start date");
}

export function publishedAtValue(isPublished: boolean, value: string) {
  if (!isPublished) return value || null;
  return value || new Date().toISOString();
}

export function validateNewsPublication(isPublished: boolean, summary: string, contentHtml: string) {
  if (isPublished && !summary.trim() && !contentHtml.trim()) {
    throw new Error("Add a summary or article content before publishing");
  }
}

export function publishingWriteError(error: unknown, kind: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (/duplicate key|unique constraint/i.test(message)) {
    return new Error(`A ${kind.toLowerCase()} with this URL slug already exists`);
  }
  return error instanceof Error ? error : new Error(`Could not save ${kind.toLowerCase()}`);
}
