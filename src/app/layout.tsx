import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ConvexClientProvider } from "@/providers/convex-provider";

export const metadata: Metadata = {
  title: "LifeKit.AI - Your AI Life Admin Co-Pilot",
  description: "Handle life admin with AI. Scan documents, get insights, draft emails, and stay on top of your tasks.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
