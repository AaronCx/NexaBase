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
    "NexaBase is a production-ready AI SaaS platform powered by OpenAI, built with Next.js and FastAPI.",
  keywords: ["AI", "SaaS", "ChatGPT", "OpenAI", "LangChain"],
  authors: [{ name: "NexaBase Team" }],
  openGraph: {
    type: "website",
    title: "NexaBase — AI SaaS Platform",
    description: "Production-ready AI SaaS starter with Next.js 14 + FastAPI",
    siteName: "NexaBase",
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
