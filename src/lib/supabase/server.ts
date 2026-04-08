import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Supabase client. Use from Server Components, route handlers,
// and Server Actions. Note: cookies() is async in Next 15.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Safe to ignore; middleware will handle the refresh.
          }
        },
      },
    },
  );
}
