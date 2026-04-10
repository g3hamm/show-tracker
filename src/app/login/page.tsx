import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Sign in · HAMMFLIX",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-8 bg-[#C01900]">
      <Logo size="lg" />
      <SignIn
        routing="hash"
        forceRedirectUrl="/"
        appearance={{
          elements: {
            card: "bg-[#1a1a1a] border-none shadow-2xl",
            headerTitle: "text-white",
            headerSubtitle: "text-white/60",
            formFieldLabel: "text-white/80",
            formFieldInput: "bg-[#2a2a2a] border-[#444] text-white",
            formButtonPrimary: "bg-[#C01900] hover:bg-[#d91e00]",
            footerActionLink: "text-[#ff4d3a] hover:text-[#ff6b5a]",
            footerActionText: "text-white/50",
            dividerLine: "bg-white/20",
            dividerText: "text-white/40",
            socialButtonsBlockButton: "bg-[#2a2a2a] border-[#444] text-white hover:bg-[#333]",
            identityPreviewEditButton: "text-[#ff4d3a]",
            formFieldAction: "text-[#ff4d3a]",
            internal: "text-white",
          },
        }}
      />
    </main>
  );
}
