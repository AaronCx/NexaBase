import Link from "next/link";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="text-center max-w-md">
        <Bot className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h1 className="text-4xl font-extrabold mb-2">404</h1>
        <p className="text-muted-foreground mb-6">
          This page doesn&apos;t exist. It may have been moved or deleted.
        </p>
        <Link href="/">
          <Button>Back to home</Button>
        </Link>
      </div>
    </div>
  );
}
