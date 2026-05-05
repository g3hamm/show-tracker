import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";

export default function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <header className="bg-[#C01900] shadow-lg">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              &larr; Dashboard
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
