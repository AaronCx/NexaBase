"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } else {
        setSent(true);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Bot className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold">NexaBase</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{sent ? "Check your email" : "Reset password"}</CardTitle>
            <CardDescription>
              {sent
                ? `We sent a reset link to ${email}`
                : "Enter your email and we'll send you a reset link"}
            </CardDescription>
          </CardHeader>

          {!sent ? (
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
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send reset link
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-primary hover:underline font-medium"
                >
                  try again
                </button>
                .
              </p>
            </CardContent>
          )}
        </Card>

        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
