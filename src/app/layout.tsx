import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Show Tracker",
  description:
    "Track the TV shows we're watching and get notified when new episodes drop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
