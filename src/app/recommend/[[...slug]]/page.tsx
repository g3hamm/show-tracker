import Link from "next/link";
import { getPublicWatchlist } from "@/lib/shows/public-queries";
import { PublicWatchlist } from "@/components/PublicWatchlist";
import { Logo } from "@/components/Logo";
import { RecommendForm } from "../RecommendForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Recommend a show · HAMMFLIX",
};

function toProperCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function RecommendPage({ params }: PageProps) {
  const { slug } = await params;
  const defaultName = slug?.[0] ? toProperCase(slug[0]) : undefined;
  const watchlist = await getPublicWatchlist();

  return (
    <main className="min-h-screen flex items-start justify-center p-6 sm:p-8 relative">
      <Link
        href="/login"
        className="absolute top-6 right-6 sm:top-8 sm:right-8 text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
      >
        Log in
      </Link>
      <div className="w-full max-w-xl mt-8">
        <div className="mb-6"><Logo size="sm" /></div>
        <h1 className="text-2xl font-bold tracking-tight">Recommend a show</h1>
        <p className="text-sm text-[color:var(--muted)] mt-1 mb-6">
          Think of a show we&apos;d love? Drop it below and we&apos;ll see it on our
          dashboard. No account needed.
        </p>

        <PublicWatchlist shows={watchlist} />

        <RecommendForm defaultName={defaultName} />
      </div>
    </main>
  );
}
