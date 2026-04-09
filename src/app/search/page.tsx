import Link from "next/link";
import { SearchBox } from "./SearchBox";

export const metadata = {
  title: "Add a show · HAMMFLIX",
};

export default function SearchPage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto p-6 sm:p-8">
      <header className="mb-6">
        <Link
          href="/"
          className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">Add a show</h1>
        <p className="text-sm text-[color:var(--muted)]">
          Search TMDB and add it to the shared tracker.
        </p>
      </header>
      <SearchBox />
    </main>
  );
}
