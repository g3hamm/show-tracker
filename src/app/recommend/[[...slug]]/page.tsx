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
    <main className="min-h-screen">
      <div className="bg-[#C01900] shadow-lg">
        <div className="max-w-xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
          <Logo />
          <Link
            href="/login"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 sm:px-8 mt-8">
        <h1 className="text-2xl font-bold tracking-tight">Recommend a show</h1>
        <p className="text-sm text-[color:var(--muted)] mt-1 mb-6">
          Think of a show we&apos;d love? Drop it below and we&apos;ll see it on our
          dashboard. No account needed.
        </p>

        <RecommendForm defaultName={defaultName} />

        <PublicWatchlist shows={watchlist} />
      </div>
    </main>
  );
}
