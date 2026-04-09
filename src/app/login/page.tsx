import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Sign in · HAMMFLIX",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-2"><Logo size="lg" /></h1>
        <p className="text-[color:var(--muted)] text-sm mb-8">
          Enter your email and we&apos;ll send you a sign-in link.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
