import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in · Show Tracker",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-2">Show Tracker</h1>
        <p className="text-[color:var(--muted)] text-sm mb-8">
          Enter your email and we&apos;ll send you a sign-in link.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
