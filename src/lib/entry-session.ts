export const GUEST_ENTRY_KEY = "jesup-guest-entry";
export const ENTRY_DESTINATION_KEY = "jesup-entry-destination";
export const GUEST_SCHOOL_KEY = "jesup-guest-school";

/** Only local public destinations can be used by Continue as guest. */
export function publicEntryDestination(input?: string | null): string {
  if (!input || !input.startsWith("/") || /[\\\r\n]/.test(input)) return "/";
  try {
    const url = new URL(input, "https://jesup.invalid");
    const decoded = decodeURIComponent(url.pathname);
    if (url.origin !== "https://jesup.invalid" || decoded.startsWith("//") || decoded.includes("\\")) return "/";
    if (/^\/(auth|admin|me|funder|oauth)(\/|$)/.test(decoded) || /^\/events\/[^/]+\/staff(\/|$)/.test(decoded)) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return "/"; }
}

export function isAuthReturn(pathname: string, search: string, hash: string): boolean {
  const params = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  return pathname.startsWith("/auth/") || pathname.startsWith("/oauth") ||
    (pathname === "/auth" && params.get("mode") === "reset") ||
    ["code", "token_hash", "access_token", "refresh_token", "error", "error_code"].some(key => params.has(key) || fragment.has(key)) ||
    ["recovery", "invite", "signup"].includes(params.get("type") ?? fragment.get("type") ?? "");
}

export function needsEntryChoice(options: { signedIn: boolean; guestChosen: boolean; authReturn: boolean }): boolean {
  return !options.signedIn && !options.guestChosen && !options.authReturn;
}

export function isPasswordSetupReturn(search: string, hash: string): boolean {
  const params = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("mode") === "reset" || ["recovery", "invite"].includes(params.get("type") ?? fragment.get("type") ?? "");
}

export function readSessionValue(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

export function writeSessionValue(key: string, value: string): void {
  try { sessionStorage.setItem(key, value); } catch { /* Choice still lives in the mounted gate. */ }
}