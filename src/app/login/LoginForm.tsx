"use client";

import { useState, useTransition } from "react";
import { signInWithMagicLink } from "./actions";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<
    { kind: "ok" | "error"; text: string } | null
  >(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await signInWithMagicLink(email);
      if (result.ok) {
        setMessage({
          kind: "ok",
          text: "Check your email for the sign-in link.",
        });
      } else {
        setMessage({
          kind: "error",
          text: result.error ?? "Something went wrong.",
        });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        autoFocus
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="px-4 py-3 rounded-md bg-[color:var(--surface)] border border-[color:var(--border)] focus:outline-none focus:border-[color:var(--accent)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-3 rounded-md bg-[color:var(--accent)] text-black font-medium disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send magic link"}
      </button>
      {message && (
        <p
          className={
            message.kind === "ok"
              ? "text-sm text-emerald-400"
              : "text-sm text-[color:var(--danger)]"
          }
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
