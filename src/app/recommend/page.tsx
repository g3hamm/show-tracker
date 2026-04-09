import { getPublicWatchlist } from "@/lib/shows/public-queries";
import { PublicWatchlist } from "@/components/PublicWatchlist";
import { RecommendForm } from "./RecommendForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Recommend a show",
};

export default async function RecommendPage() {
  const watchlist = await getPublicWatchlist();

  return (
    <main className="min-h-screen flex items-start justify-center p-6 sm:p-8">
      <div className="w-full max-w-xl mt-8">
        <h1 className="text-2xl font-semibold">Recommend a show</h1>
        <p className="text-sm text-[color:var(--muted)] mt-1 mb-6">
          Think of a show we&apos;d love? Drop it below and we&apos;ll see it on our
          dashboard. No account needed.
        </p>

        <PublicWatchlist shows={watchlist} />

        <RecommendForm />
      </div>
    </main>
  );
}
