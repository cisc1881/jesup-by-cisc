import { supabase } from "@/integrations/supabase/client";

const EXTERNAL_URL = /:\/\//;

/** Returns a safe in-app path, or null if next is missing or unsafe. */
export function validateNextPath(next: string | undefined | null): string | null {
  if (next == null) return null;

  const trimmed = next.trim();
  if (!trimmed) return null;

  if (EXTERNAL_URL.test(trimmed)) return null;
  if (trimmed.startsWith("//")) return null;
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("/\\")) return null;

  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded.startsWith("//") || EXTERNAL_URL.test(decoded)) return null;
  } catch {
    return null;
  }

  return trimmed;
}

/** Build a next path from the current router location (pathname + search + hash). */
export function nextPathFromLocation(location: {
  pathname: string;
  searchStr?: string;
  hash?: string;
}): string {
  return `${location.pathname}${location.searchStr ?? ""}${location.hash ?? ""}`;
}

/** Default post-login destination when next is missing or invalid. */
export function resolvePostLoginPath(next: string | undefined | null, isAdmin: boolean): string {
  return validateNextPath(next) ?? (isAdmin ? "/admin" : "/me");
}

export async function resolvePostLoginPathForUser(
  next: string | undefined | null,
  userId: string,
): Promise<string> {
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  return resolvePostLoginPath(next, !!role);
}
