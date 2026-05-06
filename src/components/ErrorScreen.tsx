"use client";

import Image from "next/image";
import Link from "next/link";

const JOKES = [
  "Something very UNCHILL just occurred.",
  "This is not the vibe we were going for.",
  "Even popcorn burns sometimes.",
  "The remote fell behind the couch. We're looking.",
  "A rogue kernel has entered the chat.",
  "404: Chill not found.",
  "We paused on the worst frame possible.",
];

interface ErrorScreenProps {
  reset?: () => void;
}

export function ErrorScreen({ reset }: ErrorScreenProps) {
  const joke = JOKES[Math.floor(Math.random() * JOKES.length)];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#C01900] gap-6 px-6 text-center">
      <Image
        src="/chillflix-logo.png"
        alt="Chillflix"
        width={180}
        height={50}
        priority
        className="select-none opacity-80"
      />
      <div className="flex flex-col gap-2 max-w-sm">
        <p className="text-xl font-bold text-white">{joke}</p>
        <p className="text-sm text-white/50">
          A server error occurred. Try again or head back to the dashboard.
        </p>
      </div>
      <div className="flex gap-3">
        {reset && (
          <button
            onClick={reset}
            className="px-4 py-2 rounded bg-[#C01900] hover:bg-[#a01400] text-white text-sm font-semibold transition-colors"
          >
            Try again
          </button>
        )}
        <Link
          href="/"
          className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
