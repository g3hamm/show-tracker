"use client";

import { useClerk } from "@clerk/nextjs";

export function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/login" })}
      className="text-sm text-white/70 hover:text-white transition-colors"
    >
      Sign out
    </button>
  );
}
