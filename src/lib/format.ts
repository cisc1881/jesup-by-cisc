const DISPLAY_LOCALE = "en-US";
const DISPLAY_TIME_ZONE = "America/Chicago";

export function fmtDate(d?: string | null) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString(DISPLAY_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  });
}
export function fmtDateTime(d?: string | null) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString(DISPLAY_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: DISPLAY_TIME_ZONE,
  });
}

export function fmtDuration(seconds?: number | null) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
