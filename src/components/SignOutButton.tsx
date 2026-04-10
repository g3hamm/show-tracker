"use client";

import { useClerk } from "@clerk/nextjs";

export function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/login" })}
      className="text-xs text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
    >
      Sign out
    </button>
  );
}
