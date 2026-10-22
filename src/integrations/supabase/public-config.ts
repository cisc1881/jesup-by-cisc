// Follow this recovered project's managed public connection, never the lost project.
// Hosted builds inherited from the lost project may receive no (or stale) connection
// settings, so fall back to this project's publishable values. Only public values live here.
const RECOVERED_PUBLIC_URL = "https://trffktqewlrzziowmspd.supabase.co";
const RECOVERED_PUBLISHABLE_KEY = "sb_publishable__XE12tMJAanX900z96qGuA_NmC1v3LN";
const LOST_PROJECT_REF = "bgpagczihcnondqttjnq";

export function resolvePublicConnection(url?: string | null, key?: string | null) {
  const usable = Boolean(url && key && !url.includes(LOST_PROJECT_REF));
  return usable
    ? { url: url as string, key: key as string }
    : { url: RECOVERED_PUBLIC_URL, key: RECOVERED_PUBLISHABLE_KEY };
}

const browserConnection = resolvePublicConnection(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

export const JESUP_SUPABASE_URL = browserConnection.url;
export const JESUP_SUPABASE_PUBLISHABLE_KEY = browserConnection.key;
