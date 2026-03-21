"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Loader2 } from "lucide-react";
import { isDemoMode } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/useToast";

const DEMO_ACCOUNTS = [
  { email: "demo@nexabase.app", password: "demo1234", label: "Demo User" },
  { email: "test@nexabase.app", password: "test1234", label: "Test User" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(account.password);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (isDemoMode) {
      router.push(redirectTo);
      return;
    }

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  function handleEnterDemo() {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Bot className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold">NexaBase</span>
        </div>

        {isDemoMode ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              Welcome to the NexaBase Demo
            </p>
            <p className="text-sm text-blue-700 mb-3">
              Explore all features with a pre-configured Pro account. No sign-up required.
            </p>
            <Button onClick={handleEnterDemo} className="w-full">
              Enter Demo
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              Try NexaBase with a demo account
            </p>
            <div className="flex flex-col gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm border border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                >
                  <span className="font-medium text-blue-800">{account.label}</span>
                  <span className="text-blue-600 font-mono text-xs">
                    {account.email} / {account.password}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Click an account above to fill in the credentials
            </p>
          </div>
        )}

        <Card className={isDemoMode ? "opacity-60 pointer-events-none" : ""}>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              {isDemoMode
                ? "Sign up is disabled in demo mode."
                : "Sign in to your NexaBase account"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={!isDemoMode}
                  autoComplete="email"
                  disabled={isDemoMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isDemoMode}
                  autoComplete="current-password"
                  disabled={isDemoMode}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading || isDemoMode}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot your password?
              </Link>
              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up free
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  );
}
