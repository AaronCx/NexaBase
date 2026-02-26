import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, CreditCard, Zap, TrendingUp } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  const tier = profile?.tier ?? "free";
  const used = profile?.messages_used_this_month ?? 0;
  const limit = tier === "pro" ? 5000 : 50;
  const usagePct = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your NexaBase account.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{tier}</div>
            <Badge variant={tier === "pro" ? "default" : "secondary"} className="mt-1">
              {tier === "pro" ? "Active" : "Free tier"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages Used</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {used} <span className="text-sm font-normal text-muted-foreground">/ {limit}</span>
            </div>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{usagePct}% used this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages Left</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{Math.max(0, limit - used)}</div>
            <p className="text-xs text-muted-foreground mt-1">Remaining this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Billing</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tier === "pro" ? "$19" : "$0"}</div>
            <p className="text-xs text-muted-foreground mt-1">Per month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Start a conversation</CardTitle>
            <CardDescription>
              Chat with your AI assistant powered by GPT-4o mini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/chat">
              <Button className="w-full sm:w-auto">
                <MessageSquare className="mr-2 h-4 w-4" />
                Open AI Chat
              </Button>
            </Link>
          </CardContent>
        </Card>

        {tier === "free" && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-blue-900">Upgrade to Pro</CardTitle>
              <CardDescription className="text-blue-700">
                Get 5,000 messages/month and priority support for $19/mo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/billing">
                <Button variant="default" className="w-full sm:w-auto">
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade now
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {tier === "pro" && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Subscription</CardTitle>
              <CardDescription>
                View invoices, update payment method, or cancel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/billing">
                <Button variant="outline" className="w-full sm:w-auto">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage billing
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
