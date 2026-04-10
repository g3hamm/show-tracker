import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Sign in · HAMMFLIX",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      <Logo size="lg" />
      <SignIn
        routing="hash"
        forceRedirectUrl="/"
      />
    </main>
  );
}
