"use server";

import { createClient } from "@/lib/supabase/server";

export interface SignInResult {
  ok: boolean;
  error?: string;
}

export async function signInWithMagicLink(
  email: string,
): Promise<SignInResult> {
  const trimmed = (email || "").trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
