import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chillflix",
  description:
    "Track the TV shows we're watching and get notified when new episodes drop.",
  icons: {
    apple: "/chillflix-app-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#C01900",
          colorBackground: "#1a1a1a",
          colorText: "#e5e5e5",
          colorInputBackground: "#2a2a2a",
          colorInputText: "#e5e5e5",
        },
      }}
    >
      <html lang="en">
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
