"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isDemoMode) {
      router.push("/dashboard");
      return;
    }

    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 8 characters.",
      });
      return;
    }

    setLoading(true);

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    // Auto-login after signup (no email confirmation required)
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      toast({
        title: "Account created!",
        description: "You can now sign in with your credentials.",
      });
      router.push("/login");
      return;
    }

    toast({
      title: "Welcome to NexaBase!",
      description: "Your account is ready to use.",
    });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Bot className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold">NexaBase</span>
        </div>

        {isDemoMode && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              Demo Mode
            </p>
            <p className="text-sm text-blue-700 mb-3">
              Sign up is disabled in demo mode. Jump straight into the app with a pre-configured Pro account.
            </p>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Enter Demo
            </Button>
          </div>
        )}

        <Card className={isDemoMode ? "opacity-60 pointer-events-none" : ""}>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              {isDemoMode
                ? "Sign up is disabled in demo mode."
                : "Get started with 50 free AI messages per month"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  disabled={isDemoMode}
                />
              </div>
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
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isDemoMode}
                  minLength={8}
                  autoComplete="new-password"
                  disabled={isDemoMode}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading || isDemoMode}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create account
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
              <p className="text-xs text-muted-foreground text-center">
                By registering, you agree to our Terms of Service and Privacy
                Policy.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
