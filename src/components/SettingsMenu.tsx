"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { refreshAll } from "@/lib/shows/actions";

export function RefreshButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), 3000);
    return () => clearTimeout(t);
  }, [result]);

  function onClick() {
    setResult(null);
    startTransition(async () => {
      try {
        const r = await refreshAll();
        setResult(
          r.failed > 0
            ? `${r.refreshed} refreshed, ${r.failed} failed`
            : `${r.refreshed} refreshed`,
        );
      } catch (err) {
        setResult(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        title="Refresh show data"
        className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-5 h-5 ${pending ? "animate-spin" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.598a.75.75 0 0 0-.75.75v3.634a.75.75 0 0 0 1.5 0v-2.033l.262.263a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.01-.131Zm-3.644-6.848a7 7 0 0 0-11.712 3.138.75.75 0 0 0 1.01.131 5.5 5.5 0 0 1 9.201-2.466l.312.311H8.046a.75.75 0 0 0 0 1.5h3.634a.75.75 0 0 0 .75-.75V2.776a.75.75 0 0 0-1.5 0v2.033l-.262-.263Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {result && (
        <span className="absolute top-full right-0 mt-1 whitespace-nowrap text-[10px] text-white/70 bg-black/60 rounded px-2 py-1">
          {result}
        </span>
      )}
    </div>
  );
}

export function SettingsMenu({ shareHref }: { shareHref: string }) {
  const [open, setOpen] = useState(false);
  const { signOut } = useClerk();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Settings"
        className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path
            fillRule="evenodd"
            d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 5A.75.75 0 0 1 2.75 9h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 9.75Zm0 5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            className="absolute top-0 right-0 h-full w-72 bg-[color:var(--background)] border-l border-[color:var(--border)] shadow-2xl animate-slide-in flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--border)]">
              <h2 className="font-semibold text-sm">Settings</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-[color:var(--surface-elevated)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col py-2">
              <Link
                href="/family"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-[color:var(--surface)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[color:var(--muted)]">
                  <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                </svg>
                My Household
              </Link>
              <Link
                href={shareHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-[color:var(--surface)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[color:var(--muted)]">
                  <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
                  <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
                </svg>
                Recommendation Link
              </Link>
              <Link
                href="/family/subscriptions"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-[color:var(--surface)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[color:var(--muted)]">
                  <path d="M1 4.75C1 3.784 1.784 3 2.75 3h14.5c.966 0 1.75.784 1.75 1.75v10.515a1.75 1.75 0 0 1-1.75 1.75h-1.5a.75.75 0 0 1-.53-.22l-1.72-1.72H6.5l-1.72 1.72a.75.75 0 0 1-.53.22h-1.5A1.75 1.75 0 0 1 1 15.265V4.75Zm16 .5v9.015h-.22l-1.72 1.72a.75.75 0 0 1-.53.22H5.47a.75.75 0 0 1-.53-.22l-1.72-1.72H3V5.25h14Z" />
                  <path d="M6 9.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 6 9.25ZM9.25 12a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Z" />
                </svg>
                My Subscriptions
              </Link>

              <div className="mx-5 my-2 border-t border-[color:var(--border)]" />

              <button
                type="button"
                onClick={() => signOut({ redirectUrl: "/login" })}
                className="flex items-center gap-3 px-5 py-3 text-sm text-[color:var(--danger)] hover:bg-[color:var(--surface)] transition-colors text-left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
                </svg>
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
