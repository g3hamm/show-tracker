import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SearchBox } from "./SearchBox";

export const metadata = {
  title: "Add a show · HAMMFLIX",
};

export default function SearchPage() {
  return (
    <main className="min-h-screen">
      <div className="bg-[#C01900] shadow-lg">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <Link
            href="/"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </div>
      <div className="max-w-3xl mx-auto p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Add a show</h1>
        <p className="text-sm text-[color:var(--muted)] mb-6">
          Search TMDB and add it to the shared tracker.
        </p>
        <SearchBox />
      </div>
    </main>
  );
}
