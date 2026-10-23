/** Reusable event speaker profiles: contact validation and session countdown logic. */

export const SOCIAL_PLATFORMS = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "x", label: "X (Twitter)" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
  { id: "other", label: "Link" },
] as const;

export type SocialPlatformId = (typeof SOCIAL_PLATFORMS)[number]["id"];

export type SpeakerSocialLink = {
  platform: SocialPlatformId;
  label: string;
  url: string;
};

/**
 * Accepts a bare domain or full URL and returns a safe https URL, or null when
 * the value cannot be a public web link. Rejects javascript:, data:, mailto:,
 * credentials, and non-web schemes.
 */
export function sanitizeSpeakerUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 500) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (!url.hostname.includes(".")) return null;
  return url.toString();
}

export function isValidContactEmail(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (trimmed.length > 254) return false;
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(trimmed);
}

/** Digits, spaces, dashes, parentheses and a leading +; 7–20 digits total. */
export function isValidContactPhone(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (trimmed.length > 32) return false;
  if (!/^\+?[0-9 ().-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 20;
}

/** Validates and labels admin-entered social links; invalid entries are dropped. */
export function sanitizeSocialLinks(
  links: Array<{ platform?: string; url?: string }> | null | undefined,
): SpeakerSocialLink[] {
  if (!Array.isArray(links)) return [];
  const out: SpeakerSocialLink[] = [];
  for (const link of links.slice(0, 8)) {
    const platform = SOCIAL_PLATFORMS.find((p) => p.id === link.platform);
    const url = sanitizeSpeakerUrl(link.url ?? "");
    if (!platform || !url) continue;
    if (out.some((l) => l.platform === platform.id && l.url === url)) continue;
    out.push({ platform: platform.id, label: platform.label, url });
  }
  return out;
}

export type CountdownSession = {
  id: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  location?: string | null;
};

export type SessionCountdown =
  | { kind: "none" }
  | { kind: "upcoming"; startsAt: Date; sessions: CountdownSession[] }
  | { kind: "now"; sessions: CountdownSession[] }
  | { kind: "after" };

/** A session without an end time counts as "happening now" for at most this long. */
export const UNENDED_SESSION_WINDOW_MS = 4 * 60 * 60 * 1000;

/**
 * Picks the live countdown target from confirmed sessions. Simultaneous sessions
 * (same start minute) are grouped. Times are absolute instants; the event
 * timezone only affects display, never this calculation.
 */
export function sessionCountdown(
  sessions: CountdownSession[],
  now: Date = new Date(),
): SessionCountdown {
  const timed = sessions
    .filter((s) => s.startsAt)
    .map((s) => ({ ...s, start: new Date(s.startsAt!), end: s.endsAt ? new Date(s.endsAt) : null }))
    .filter((s) => !Number.isNaN(s.start.getTime()));
  if (timed.length === 0) return { kind: "none" };

  const nowMs = now.getTime();
  const current = timed.filter((s) => {
    const endMs = s.end ? s.end.getTime() : s.start.getTime() + UNENDED_SESSION_WINDOW_MS;
    return s.start.getTime() <= nowMs && endMs > nowMs;
  });
  if (current.length > 0) return { kind: "now", sessions: current };

  const future = timed.filter((s) => s.start.getTime() > nowMs);
  if (future.length === 0) return { kind: "after" };

  const nextMs = Math.min(...future.map((s) => s.start.getTime()));
  const simultaneous = future.filter((s) => s.start.getTime() === nextMs);
  return { kind: "upcoming", startsAt: new Date(nextMs), sessions: simultaneous };
}

export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number };

export function countdownParts(target: Date, now: Date = new Date()): CountdownParts {
  const ms = Math.max(0, target.getTime() - now.getTime());
  const seconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}
