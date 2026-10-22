import { createServerOnlyFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { resolvePublicConnection } from '@/integrations/supabase/public-config';

/** Public SSR reads use request-time server configuration, never browser storage or the viewer proxy. */
export const createPublicDataClient = createServerOnlyFn(() => {
  const { url, key } = resolvePublicConnection(
    process.env['SUPABASE_URL'] ?? import.meta.env.VITE_SUPABASE_URL,
    process.env['SUPABASE_PUBLISHABLE_KEY'] ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
});
