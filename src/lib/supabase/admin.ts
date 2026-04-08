import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Secret-key client. Bypasses RLS. NEVER expose to the browser.
// Used by the cron refresh route and by the public /recommend submission action.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
