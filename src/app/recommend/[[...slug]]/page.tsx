import Link from "next/link";
import { getPublicWatchlist } from "@/lib/shows/public-queries";
import { getRecommendPageInfo } from "@/lib/families/queries";
import { PublicWatchlist } from "@/components/PublicWatchlist";
import { Logo } from "@/components/Logo";
import { RecommendForm } from "../RecommendForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Recommend a show · Chillflix",
};

function toProperCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

interface PageProps {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RecommendPage({ params, searchParams }: PageProps) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const defaultName = slug?.[0] ? toProperCase(slug[0]) : undefined;
  const queueShareCode = typeof sp.q === "string" ? sp.q : undefined;

  const [watchlist, queueInfo] = await Promise.all([
    getPublicWatchlist(),
    queueShareCode ? getRecommendPageInfo(queueShareCode) : null,
  ]);

  const heading = queueInfo
    ? `Recommend a show to ${queueInfo.displayName}`
    : "Recommend a show";

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
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        <p className="text-sm text-[color:var(--muted)] mt-1 mb-6">
          Think of a show {queueInfo ? "they" : "we"}&apos;d love? Drop it below and {queueInfo ? "they" : "we"}&apos;ll see it on {queueInfo ? "their" : "our"}{" "}
          dashboard. No account needed.
        </p>

        <RecommendForm defaultName={defaultName} queueShareCode={queueShareCode} />
      </div>

      <PublicWatchlist shows={watchlist} />
    </main>
  );
}
