"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/app/login/actions";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-xs text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
