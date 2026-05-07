"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { removeShow } from "@/lib/shows/actions";

export function RemoveShowButton({ id }: { id: string }) {
  const [showModal, setShowModal] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRemove() {
    startTransition(async () => {
      await removeShow(id);
      setShowModal(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowModal(true); }}
        className="flex-1 text-[11px] py-1 rounded bg-[color:var(--surface-elevated)] hover:bg-[color:var(--danger)]/20 border border-[color:var(--border)] hover:border-[color:var(--danger)]/50 transition-colors"
      >
        Remove
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => { if (!pending) setShowModal(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl shadow-2xl w-80 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cuppie header strip */}
            <div className="bg-[#C01900] flex items-end justify-center pt-4 h-32 overflow-hidden">
              <Image
                src="/cuppie.png"
                alt=""
                width={100}
                height={100}
                className="object-contain object-bottom"
              />
            </div>

            {/* Body */}
            <div className="px-6 pt-5 pb-6 text-center space-y-4">
              <div>
                <p className="font-bold text-base text-[color:var(--foreground)]">
                  Wait — they were just getting good.
                </p>
                <p className="text-sm text-[color:var(--muted)] mt-1 leading-snug">
                  Remove this show from your queue forever?
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={pending}
                  className="flex-1 py-2 text-sm font-medium rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--border)] hover:bg-[color:var(--border)] transition-colors disabled:opacity-50"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={pending}
                  className="flex-1 py-2 text-sm font-bold rounded-lg bg-[#C01900] hover:bg-[#a01400] text-white transition-colors disabled:opacity-50"
                >
                  {pending ? "Removing…" : "Yes, remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
