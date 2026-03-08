import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "NexaBase — AI SaaS Platform",
    template: "%s | NexaBase",
  },
  description:
    "NexaBase is a production-ready AI SaaS platform with chat, billing, and user management. Powered by GPT-4o mini, built with Next.js 14 and FastAPI.",
  keywords: [
    "AI",
    "SaaS",
    "ChatGPT",
    "OpenAI",
    "LangChain",
    "AI chat",
    "AI assistant",
    "SaaS starter",
    "Next.js",
    "FastAPI",
  ],
  authors: [{ name: "NexaBase Team" }],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://nexabase.vercel.app"
  ),
  openGraph: {
    type: "website",
    title: "NexaBase — Your AI Assistant, Production-Ready",
    description:
      "Full-stack AI SaaS with auth, billing, usage tracking, and an intelligent chat UI. Start free with 50 messages/month.",
    siteName: "NexaBase",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NexaBase — AI SaaS Platform",
    description:
      "Production-ready AI SaaS starter with chat, billing, and user management.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
